import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile, cp, mkdtemp, symlink, rm } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// No production services: start an isolated app copy and synthetic Supabase adapter.
const repo = fileURLToPath(new URL("../", import.meta.url));
const runDir = await mkdtemp(join(tmpdir(), "rehab-browser-qa-"));
const appDir = join(runDir, "app");
const outputDir = join(runDir, "artifacts");
await mkdir(appDir);
await mkdir(outputDir);
const children = [];
async function start(command, args, options, readyText) {
  const child = spawn(command, args, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error("QA server did not start: " + output)),
      45000,
    );
    const inspect = (chunk) => {
      output += chunk.toString();
      appendFileSync(join(outputDir, "servers.log"), chunk);
      if (output.includes(readyText)) {
        clearTimeout(timeout);
        resolve(child);
      }
    };
    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error("QA server exited: " + code + " " + output));
    });
  });
}
let browser;
try {
  for (const name of [
    "src",
    "messages",
    "public",
    "next.config.ts",
    "next-env.d.ts",
    "tsconfig.json",
    "package.json",
    "package-lock.json",
    "postcss.config.mjs",
  ])
    await cp(join(repo, name), join(appDir, name), { recursive: true });
  await symlink(
    join(repo, "node_modules"),
    join(appDir, "node_modules"),
    "dir",
  );
  await start(
    process.execPath,
    [join(repo, "tests/helpers/rehab-api-fixture.mjs")],
    { cwd: repo },
    "Local rehab fixture ready",
  );
  const fixtureEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-fixture-anon",
    SUPABASE_SERVICE_ROLE_KEY: "local-fixture-service",
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
  };
  console.log("Building isolated browser fixture");
  const buildOutput = execFileSync(process.execPath, [join(repo, "node_modules/next/dist/bin/next"), "build", "--webpack"], { cwd: appDir, env: fixtureEnv, encoding: "utf8", timeout: 120000 });
  await writeFile(join(outputDir, "build.log"), buildOutput);
  await start(process.execPath, [join(repo, "node_modules/next/dist/bin/next"), "start", "-p", "3100"], { cwd: appDir, env: fixtureEnv }, "Ready");
  browser = await chromium.launch({
    channel: process.platform === "darwin" ? "chrome" : undefined,
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  });
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  try {
    await page.goto("http://localhost:3100/en/rehab/login");
    console.log("Login page:", page.url());
    await page.getByRole("heading", { name: "Sport Care Med", exact: true }).waitFor();
    assert.equal(await page.getByText("Rehab platform", { exact: true }).count(), 0);
    assert.ok(await page.getByRole("img", { name: "Sport Care Med", exact: true }).evaluate(img => img.complete && img.naturalWidth === 682));
    await page.screenshot({ path: join(outputDir, "login-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(outputDir, "login-mobile.png"), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.getByLabel("Email", { exact: true }).fill("admin@qa.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("test-only-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.includes("login"));

    const base = "http://localhost:3100";
    const workspace = "00000000-0000-0000-0000-000000000102";
    const patient = "30000000-0000-4000-8000-000000000002";
    const calendarUrl = `${base}/en/rehab/termini?workspace=${workspace}&month=2026-09`;
    await page.goto(calendarUrl);
    await page.getByRole("heading", { name: "September 2026", exact: true }).waitFor();
    await page.getByRole("link", { name: "Next month", exact: true }).click();
    await page.getByRole("heading", { name: "October 2026", exact: true }).waitFor();
    await page.getByRole("link", { name: "Previous month", exact: true }).click();
    await page.getByRole("heading", { name: "September 2026", exact: true }).waitFor();
    await page.getByRole("link", { name: /Tuesday.*15 September/ }).click();
    await page.waitForURL(url => url.searchParams.get("day") === "2026-09-15");
    assert.equal(await page.locator('input[name="starts_at"]').first().inputValue(), "2026-09-15T09:00");
    const form = page.locator("form").filter({ has: page.locator('select[name="patient_id"]') });
    await form.locator('select[name="patient_id"]').selectOption(patient);
    await form.locator('input[name="therapy"]').fill("Calendar QA appointment");
    await form.getByRole("button", { name: "Schedule appointment", exact: true }).click();
    await page.waitForURL(url => url.searchParams.has("saved"));
    await page.locator("article").getByText("Calendar QA appointment", { exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get("day"), "2026-09-15");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: join(outputDir, "calendar-desktop.png"), fullPage: true });
    const deleteButton = page.getByRole("button", { name: "Delete appointment", exact: true });
    page.once("dialog", dialog => dialog.dismiss());
    await deleteButton.click();
    assert.equal(await page.locator("article").count(), 1);
    page.once("dialog", dialog => dialog.accept());
    await deleteButton.click();
    await page.getByText("Appointment deleted.", { exact: true }).waitFor();
    assert.equal(await page.locator("article").count(), 0);
    await page.goto(`${base}/sr/rehab/termini?workspace=${workspace}&month=2026-09`);
    await page.getByRole("heading", { name: "septembar 2026.", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: join(outputDir, "calendar-mobile-sr.png"), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(`${base}/en/rehab/pacijenti/${patient}?workspace=${workspace}`);
    await page.getByText("Delete entire record", { exact: true }).click();
    const nameLabel = await page.locator('input[name="confirm_name"]').locator('..').textContent();
    const fullName = nameLabel.replace("To confirm, enter: ", "").trim();
    await page.locator('input[name="confirm_name"]').fill("Wrong name");
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Permanently delete record", exact: true }).click();
    await page.waitForURL(url => url.searchParams.has("error"));
    await page.getByRole("heading", { name: fullName, exact: true }).waitFor();
    await page.getByText("Delete entire record", { exact: true }).click();
    await page.locator('input[name="confirm_name"]').fill(fullName);
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Permanently delete record", exact: true }).click();
    await page.waitForURL(url => url.searchParams.get("saved") === "record-deleted");
    await page.getByText("The record and all related entries, plans and appointments have been deleted.", { exact: true }).waitFor();
    const response = await fetch(`http://127.0.0.1:54329/rest/v1/rehab_daily_entries?patient_id=eq.${patient}`);
    assert.deepEqual(await response.json(), []);

    // A clinic therapist must see and submit the same confirmed deletion flow.
    await page.context().clearCookies();
    await page.goto(`${base}/en/rehab/login`);
    await page.getByLabel("Email", { exact: true }).fill("therapist@qa.invalid");
    await page.getByLabel("Password", { exact: true }).fill("test-only-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(url => !url.pathname.includes("login"));
    const clinic = "00000000-0000-0000-0000-000000000101";
    const clinicPatient = "30000000-0000-4000-8000-000000000001";
    await page.goto(`${base}/en/rehab/izvestaji/stampa?workspace=${clinic}&patient=${clinicPatient}`);
    await page.getByRole("button", { name: "Preview report", exact: true }).click();
    await page.locator(".rehab-report-document").waitFor();
    const reportLogo = page.locator('.rehab-report-document img[src="/brand/clinic-logo.png"]');
    assert.equal(await reportLogo.count(), 1);
    assert.ok(await reportLogo.evaluate(img => img.complete && img.naturalWidth === 682));
    await page.emulateMedia({ media: "print" });
    await page.screenshot({ path: join(outputDir, "clinic-report-print.png"), fullPage: true });
    await page.emulateMedia({ media: "screen" });
    await page.goto(`${base}/en/rehab/pacijenti/${clinicPatient}?workspace=${clinic}`);
    assert.equal(await page.getByRole("link", { name: "Main administrator", exact: true }).count(), 0);
    await page.getByText("Delete entire record", { exact: true }).click();
    await page.locator('input[name="confirm_name"]').fill("Patient QA");
    await page.screenshot({ path: join(outputDir, "therapist-record-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: join(outputDir, "therapist-record-mobile.png"), fullPage: true });
    page.once("dialog", dialog => dialog.dismiss());
    await page.getByRole("button", { name: "Permanently delete record", exact: true }).click();
    await page.getByRole("heading", { name: "Patient QA", exact: true }).waitFor();
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Permanently delete record", exact: true }).click();
    await page.waitForURL(url => url.searchParams.get("saved") === "record-deleted");
    await page.getByText("The record and all related entries, plans and appointments have been deleted.", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log("PASS: branded login, clinic print logo, mobile layout, calendar, appointment deletion, admin and therapist confirmed record deletion");
  } catch (e) {
    await page.screenshot({
      path: join(outputDir, "failure.png"),
      fullPage: true,
    });
    await writeFile(
      join(outputDir, "failure.txt"),
      await page.locator("body").innerText(),
    );
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
} finally {
  for (const child of children.reverse()) child.kill("SIGTERM");
  await rm(appDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
  console.log("Browser QA artifacts: " + outputDir);
}
