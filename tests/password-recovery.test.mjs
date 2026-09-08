import test from "node:test";
import assert from "node:assert/strict";
import { createPasswordRecovery, passwordValidation, recoveryTokenFromHash } from "../src/lib/password-recovery.ts";

const hash = "a".repeat(64);
test("only accepts a single recovery token in the fragment", () => {
  assert.equal(recoveryTokenFromHash(`#token_hash=${hash}&type=recovery`), hash);
  for (const value of ["", "#type=recovery", `#token_hash=${hash}&type=signup`,
    `#token_hash=${hash}&type=recovery&type=email`, `#token_hash=${hash}&token_hash=${hash}&type=recovery`,
    `#token_hash=${hash}&type=recovery&error=expired`, "#token_hash=short&type=recovery",
    "#access_token=existing-session&type=recovery", `#token_hash=${"a".repeat(513)}&type=recovery`]) {
    assert.equal(recoveryTokenFromHash(value), null);
  }
});

test("validates length, Unicode byte limit and matching confirmation", () => {
  assert.equal(passwordValidation("short", "short"), "weak");
  assert.equal(passwordValidation("long-enough", "different"), "mismatch");
  assert.equal(passwordValidation("č".repeat(37), "č".repeat(37)), "weak");
  assert.equal(passwordValidation("a".repeat(73), "a".repeat(73)), "weak");
  assert.equal(passwordValidation("a".repeat(72), "a".repeat(72)), null);
  assert.equal(passwordValidation("long-enough", "long-enough"), null);
});

function fixture(overrides = {}) {
  const calls = [];
  const auth = {
    async verifyOtp(input) { calls.push(["verify", input.type]); return { data: { session: {} }, error: null }; },
    async getUser() { return { data: { user: { id: "recovery-user", email: "demo@example.test" } }, error: null }; },
    async updateUser() { calls.push(["update"]); return { data: {}, error: null }; },
    async signOut(input) { calls.push(["logout", input.scope]); return { error: null }; },
    ...overrides,
  };
  return { flow: createPasswordRecovery(auth), auth, calls };
}

test("an existing session alone cannot change a password", async () => {
  const { flow, calls } = fixture();
  assert.equal(await flow.save("new-password", "new-password"), "invalid");
  assert.deepEqual(calls, []);
});

test("a verified link changes only its user, logs out, and cannot be reused", async () => {
  const { flow, calls } = fixture();
  assert.deepEqual(await flow.verify(hash), { email: "demo@example.test" });
  assert.equal(await flow.save("new-password", "different"), "mismatch");
  assert.equal(await flow.save("new-password", "new-password"), "saved");
  assert.equal(await flow.save("other-password", "other-password"), "invalid");
  assert.deepEqual(calls, [["verify", "recovery"], ["update"], ["logout", "local"]]);
});

test("invalid/expired token never authorizes an update", async () => {
  const { flow, calls } = fixture({ async verifyOtp() { return { data: { session: null }, error: { status: 403 } }; } });
  assert.deepEqual(await flow.verify(hash), { error: "invalid" });
  assert.equal(await flow.save("new-password", "new-password"), "invalid");
  assert.deepEqual(calls, []);
});

test("missing session and identity changes fail closed", async () => {
  const missing = fixture({ async verifyOtp() { return { data: { session: null }, error: null }; } });
  assert.deepEqual(await missing.flow.verify(hash), { error: "invalid" });
  const { flow, auth, calls } = fixture();
  await flow.verify(hash);
  auth.getUser = async () => ({ data: { user: { id: "other-user", email: "other@example.test" } }, error: null });
  assert.equal(await flow.save("new-password", "new-password"), "invalid");
  assert.deepEqual(calls, [["verify", "recovery"]]);
});

test("network failure and password policy errors are surfaced", async () => {
  const broken = fixture({ async verifyOtp() { throw new Error("offline"); } });
  assert.deepEqual(await broken.flow.verify(hash), { error: "network" });
  for (const [code, expected] of [["same_password", "same"], ["weak_password", "weak"], ["other", "failed"]]) {
    const { flow } = fixture({ async updateUser() { return { error: { code } }; } });
    await flow.verify(hash);
    assert.equal(await flow.save("new-password", "new-password"), expected);
  }
});

test("logout failure after update does not falsely report password failure", async () => {
  const { flow } = fixture({ async signOut() { throw new Error("offline"); } });
  await flow.verify(hash);
  assert.equal(await flow.save("new-password", "new-password"), "saved");
});
