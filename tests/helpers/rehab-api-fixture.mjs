// Local-only HTTP adapter for browser QA. It exposes only synthetic PostgreSQL data.
// This is a test double for Supabase's HTTP API; RLS is tested independently in rehab-cycles-db.test.mjs.
import http from "node:http";
import {
  createRehabTestDb,
  seedRehabTestDb,
  asUser,
  ids,
} from "./rehab-db.mjs";
const db = await createRehabTestDb();
await seedRehabTestDb(db);
await db.exec(
  `delete from rehab_workspaces where id not in ('${ids.clinic}','${ids.club}','${ids.clubB}');`,
);
await asUser(db, ids.admin);
const sample = [
  {
    title: "Mobility",
    goal: "Restore comfortable movement",
    instructions: "Gentle range of motion\nThree sets of ten repetitions",
    start_date: null,
    end_date: null,
    status: "in_progress",
  },
  {
    title: "Strength",
    goal: "Progressive loading",
    instructions:
      "Strength exercises as demonstrated.\nRecord tolerance after each session.",
    start_date: null,
    end_date: null,
    status: "planned",
  },
];
const seededPlan = (
  await db.query(
    "select save_rehab_cycle_plan($1,$2,null,$3,$4,null,null,null,$5) id",
    [
      ids.club,
      ids.athlete,
      "QA rehabilitation plan",
      "2026-09-01",
      JSON.stringify(sample),
    ],
  )
).rows[0].id;
for (let i = 0; i < 8; i++)
  await db.query(
    "insert into rehab_daily_entries(workspace_id,patient_id,recorded_on,condition_summary,pain_level,therapy,notes,created_by) values($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      ids.club,
      ids.athlete,
      `2026-09-${String(i + 1).padStart(2, "0")}`,
      "Improving mobility",
      2,
      "Supervised mobility and strength exercises. ".repeat(12),
      "Continue the prescribed programme.",
      ids.admin,
    ],
  );
for (let i = 0; i < 36; i++)
  await db.query(
    "insert into rehab_patients(workspace_id,record_type,first_name,last_name,status,created_by) values($1,'player',$2,'QA',$3,$4)",
    [
      ids.club,
      `Roster ${String(i + 1).padStart(2, "0")}`,
      i % 5 === 0 ? "completed" : "active",
      ids.admin,
    ],
  );
for (const [first, status] of [
  ["Second clinic patient", "active"],
  ["Finished clinic patient", "completed"],
]) {
  await db.query(
    "insert into rehab_patients(workspace_id,record_type,first_name,last_name,status,created_by) values($1,'patient',$2,'QA',$3,$4)",
    [ids.clinic, first, status, ids.admin],
  );
}
const user = {
  id: ids.admin,
  aud: "authenticated",
  role: "authenticated",
  email: "admin@qa.invalid",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "QA Admin" },
  created_at: "2026-01-01T00:00:00Z",
};
const tokenFor = (id) =>
  [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: id,
        role: "authenticated",
        aud: "authenticated",
        exp: Math.floor(Date.now() / 1000) + 86400,
      }),
    ).toString("base64url"),
    "local-fixture-only",
  ].join(".");
function fixtureUser(req) {
  try {
    const payload = JSON.parse(
      Buffer.from(
        (req.headers.authorization || "").split(" ")[1].split(".")[1],
        "base64url",
      ).toString(),
    );
    if (payload.sub === ids.player)
      return {
        ...user,
        id: ids.player,
        email: "player@qa.invalid",
        user_metadata: { full_name: "QA Player" },
      };
  } catch {
    /* Service role and unauthenticated fixture requests use the synthetic admin. */
  }
  return user;
}
const normalized = (row) =>
  JSON.parse(
    JSON.stringify(row, function (key, value) {
      return this[key] instanceof Date
        ? this[key]
            .toISOString()
            .slice(0, key.endsWith("_date") || key.endsWith("_on") ? 10 : 24)
        : value;
    }),
  );
async function table(name) {
  return (await db.query(`select * from "${name}"`)).rows.map(normalized);
}
function matches(row, key, value) {
  const dot = value.indexOf("."),
    op = value.slice(0, dot),
    arg = value.slice(dot + 1);
  const actual = row[key];
  if (op === "eq") return String(actual) === arg;
  if (op === "neq") return String(actual) !== arg;
  if (op === "gte") return actual >= arg;
  if (op === "lte") return actual <= arg;
  if (op === "lt") return actual < arg;
  if (op === "gt") return actual > arg;
  if (op === "in") return arg.slice(1, -1).split(",").includes(actual);
  if (op === "is") return arg === "null" ? actual === null : true;
  return true;
}
const tables = new Set([
  "profiles",
  "rehab_workspaces",
  "rehab_workspace_members",
  "rehab_patients",
  "rehab_daily_entries",
  "rehab_plans",
  "rehab_plan_cycles",
  "rehab_plan_days",
  "rehab_appointments",
  "rehab_period_summaries",
]);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1:54329");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3100");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization,apikey,content-type,x-client-info,prefer,range,accept-profile,content-profile,x-supabase-api-version",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,HEAD,OPTIONS");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const respond = (body, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(req.method === "HEAD" ? "" : JSON.stringify(body));
  };
  try {
    if (url.pathname === "/auth/v1/token") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const signedUser =
        body.email === "player@qa.invalid"
          ? {
              ...user,
              id: ids.player,
              email: body.email,
              user_metadata: { full_name: "QA Player" },
            }
          : user;
      respond({
        access_token: tokenFor(signedUser.id),
        refresh_token: "local-fixture-refresh",
        expires_in: 86400,
        token_type: "bearer",
        user: signedUser,
      });
      return;
    }
    if (url.pathname === "/auth/v1/user") {
      respond(fixtureUser(req));
      return;
    }
    if (url.pathname.startsWith("/auth/v1/admin/users/")) {
      respond({ user });
      return;
    }
    if (url.pathname === "/auth/v1/logout") {
      respond({});
      return;
    }
    if (!url.pathname.startsWith("/rest/v1/")) {
      respond({ message: "Fixture endpoint unavailable" }, 404);
      return;
    }
    const endpoint = url.pathname.slice("/rest/v1/".length);
    if (endpoint.startsWith("rpc/")) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const rpc = endpoint.slice(4);
      const allowed = {
        save_rehab_cycle_plan: [
          "p_workspace_id",
          "p_patient_id",
          "p_plan_id",
          "p_title",
          "p_start_date",
          "p_end_date",
          "p_goal",
          "p_notes",
          "p_cycles",
        ],
        copy_rehab_cycle_plan: [
          "p_workspace_id",
          "p_patient_id",
          "p_plan_id",
          "p_target_patient_id",
          "p_start_date",
        ],
      };
      if (!allowed[rpc]) throw new Error("Unsupported fixture RPC");
      const names = allowed[rpc];
      const result = await db.query(
        `select ${rpc}(${names.map((_, i) => "$" + (i + 1)).join(",")}) result`,
        names.map((k) =>
          typeof body[k] === "object" && body[k] !== null
            ? JSON.stringify(body[k])
            : body[k],
        ),
      );
      respond(result.rows[0].result);
      return;
    }
    if (!tables.has(endpoint)) throw new Error("Unsupported fixture table");
    let rows = await table(endpoint);
    for (const [key, value] of url.searchParams) {
      if (["select", "order", "limit", "offset", "or"].includes(key)) continue;
      rows = rows.filter((r) => matches(r, key, value));
    }
    const order = (url.searchParams.get("order") || "")
      .split(",")
      .filter(Boolean);
    rows.sort((a, b) => {
      for (const term of order) {
        const [key, dir] = term.split(".");
        const cmp = String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
        if (cmp) return dir === "desc" ? -cmp : cmp;
      }
      return 0;
    });
    const count = rows.length;
    const start = Number(url.searchParams.get("offset") || 0);
    rows = rows.slice(
      start,
      start + Number(url.searchParams.get("limit") || 1000),
    );
    const select = url.searchParams.get("select") || "";
    if (select.includes("cycles:")) {
      const cs = await table("rehab_plan_cycles");
      rows = rows.map((r) => ({
        ...r,
        cycles: cs.filter((c) => c.plan_id === r.id),
      }));
    }
    if (select.includes("days:")) {
      const ds = await table("rehab_plan_days");
      rows = rows.map((r) => ({
        ...r,
        days: ds.filter((d) => d.plan_id === r.id),
      }));
    }
    if (select.includes("patient:")) {
      const ps = await table("rehab_patients");
      rows = rows.map((r) => ({
        ...r,
        patient: ps.find((p) => p.id === r.patient_id),
      }));
    }
    res.setHeader(
      "Content-Range",
      `${start}-${start + rows.length - 1}/${count}`,
    );
    if (req.headers.accept?.includes("vnd.pgrst.object+json")) {
      if (rows.length !== 1) {
        respond({ code: "PGRST116", message: "Expected one row" }, 406);
        return;
      }
      respond(rows[0]);
    } else respond(rows);
  } catch (error) {
    console.error("Fixture request failed:", url.pathname, error.message);
    respond({ code: error.code || "FIXTURE", message: error.message }, 400);
  }
});
server.listen(54329, "127.0.0.1", () =>
  console.log(
    "Local rehab fixture ready",
    JSON.stringify({ ...ids, plan: seededPlan }),
  ),
);
process.on("SIGTERM", () => {
  server.close();
  db.close().then(() => process.exit(0));
});
