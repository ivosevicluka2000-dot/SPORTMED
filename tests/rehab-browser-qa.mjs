import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile, cp, mkdtemp, symlink, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
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
  await start(
    process.execPath,
    [
      join(repo, "node_modules/next/dist/bin/next"),
      "dev",
      "--webpack",
      "-p",
      "3100",
    ],
    {
      cwd: appDir,
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-fixture-anon",
        SUPABASE_SERVICE_ROLE_KEY: "local-fixture-service",
        RESEND_API_KEY: "",
        EMAIL_FROM: "",
      },
    },
    "Ready",
  );
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
    await page.getByLabel("Email", { exact: true }).fill("admin@qa.invalid");
    await page
      .getByLabel("Password", { exact: true })
      .fill("test-only-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.includes("login"));
    await page.goto("http://localhost:3100/en/rehab/klubovi");
    await page.getByRole("heading", { name: "QA Club", exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: join(outputDir, "clubs-en.png"),
      fullPage: true,
    });
    await page.goto(
      "http://localhost:3100/en/rehab/pacijenti/30000000-0000-4000-8000-000000000002?workspace=00000000-0000-0000-0000-000000000102",
    );
    await page.getByText("Plan by cycles", { exact: true }).waitFor();
    await page.getByText("+ Create new plan", { exact: true }).click();
    const form = page
      .locator("form")
      .filter({ has: page.locator('input[name="cycles"]') })
      .first();
    await form.locator('input[name="title"]').fill("Browser QA cycle plan");
    await form.getByLabel("Cycle title *", { exact: true }).fill("Cycle one");
    await form
      .getByLabel("Therapy and instructions *", { exact: true })
      .fill(
        "First exercise\nSecond exercise\n" +
          "Long cycle instructions with progressive exercise guidance. ".repeat(
            90,
          ),
      );
    await form.getByRole("button", { name: "Add cycle", exact: false }).click();
    await form
      .getByLabel("Cycle title *", { exact: true })
      .nth(1)
      .fill("Cycle two");
    await form
      .getByLabel("Therapy and instructions *", { exact: true })
      .nth(1)
      .fill("Strength phase");
    await form
      .getByRole("button", { name: "Move up", exact: false })
      .nth(1)
      .click();
    assert.equal(
      await form
        .getByLabel("Cycle title *", { exact: true })
        .first()
        .inputValue(),
      "Cycle two",
    );
    await form.getByRole("button", { name: "Save plan", exact: true }).click();
    await page.waitForURL((url) => url.searchParams.has("saved"));
    await page
      .getByText("Browser QA cycle plan", { exact: true })
      .first()
      .waitFor();
    await page.screenshot({
      path: join(outputDir, "card-cycles-en.png"),
      fullPage: true,
    });
    const savedCardUrl = page.url();
    const printPlanHref = await page.locator('a[href*="/planovi/"][href*="/stampa"]').first().getAttribute("href");
    assert.ok(printPlanHref);
    await page.goto(new URL(printPlanHref, savedCardUrl).href);
    await page.getByRole("button", { name: "Print / save PDF", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Browser QA cycle plan", exact: true }).waitFor();
    await page.getByText("Strength phase", { exact: true }).waitFor();
    await page.goto(
      "http://localhost:3100/en/rehab/izvestaji/stampa?workspace=00000000-0000-0000-0000-000000000102",
    );
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 39);
    await page.getByLabel("Scope", { exact: true }).selectOption("selected");
    await page.getByLabel("Search people", { exact: true }).fill("Player");
    await page.getByRole("checkbox").first().check();
    await page.getByLabel("Search people", { exact: true }).fill("Other");
    await page.getByRole("checkbox").first().check();
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 3);
    assert.equal(
      await page
        .locator(".rehab-report-person")
        .last()
        .getByRole("heading", { name: "Recorded therapies in the period" })
        .count(),
      1,
    );
    await page.screenshot({
      path: join(outputDir, "report-en.png"),
      fullPage: true,
    });
    await page.pdf({
      path: join(outputDir, "report-en.pdf"),
      format: "A4",
      printBackground: true,
    });
    await page
      .getByRole("button", { name: "Switch to Serbian" })
      .first()
      .click();
    await page.waitForURL((url) => url.pathname.startsWith("/sr/"));
    assert.equal(
      new URL(page.url()).searchParams.get("workspace"),
      "00000000-0000-0000-0000-000000000102",
    );
    await page
      .getByRole("button", { name: "Prikaži izveštaj", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 3);
    await page.pdf({
      path: join(outputDir, "report-sr.pdf"),
      format: "A4",
      printBackground: true,
    });
    await page.screenshot({
      path: join(outputDir, "report-sr.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: join(outputDir, "report-mobile.png"),
      fullPage: true,
    });
    // Check the one-person club flow and all three clinic scopes too.
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.goto(
      "http://localhost:3100/en/rehab/izvestaji/stampa?workspace=00000000-0000-0000-0000-000000000102&patient=30000000-0000-4000-8000-000000000002",
    );
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 1);
    await page.goto(
      "http://localhost:3100/en/rehab/izvestaji/stampa?workspace=00000000-0000-0000-0000-000000000101",
    );
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 4);
    await page.getByLabel("Scope", { exact: true }).selectOption("selected");
    await page.getByRole("checkbox").nth(0).check();
    await page.getByRole("checkbox").nth(1).check();
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 3);
    await page.getByLabel("Scope", { exact: true }).selectOption("one");
    await page.getByRole("radio").nth(0).check();
    await page
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await page.locator(".rehab-report-document").waitFor();
    assert.equal(await page.locator(".rehab-report-person").count(), 1);
    const playerPage = await browser.newPage();
    playerPage.setDefaultTimeout(30000);
    playerPage.setDefaultNavigationTimeout(30000);
    await playerPage.goto("http://localhost:3100/en/rehab/login");
    await playerPage
      .getByLabel("Email", { exact: true })
      .fill("player@qa.invalid");
    await playerPage
      .getByLabel("Password", { exact: true })
      .fill("test-only-password");
    await playerPage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await playerPage.waitForURL((url) => !url.pathname.includes("login"));
    await playerPage.goto(
      "http://localhost:3100/en/rehab/izvestaji/stampa?workspace=00000000-0000-0000-0000-000000000102",
    );
    await playerPage
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await playerPage.locator(".rehab-report-document").waitFor();
    assert.equal(await playerPage.locator(".rehab-report-person").count(), 1);
    // Deliberately bypass the disabled control; the Server Action must still refuse a group report.
    await playerPage
      .getByLabel("Scope", { exact: true })
      .evaluate((element) => (element.disabled = false));
    await playerPage.getByLabel("Scope", { exact: true }).selectOption("all");
    await playerPage
      .getByRole("button", { name: "Preview report", exact: true })
      .click();
    await playerPage
      .getByRole("alert")
      .filter({
        hasText:
          "You do not have access to the selected records in this workspace.",
      })
      .waitFor();
    assert.equal(await playerPage.locator(".rehab-report-document").count(), 0);
    await playerPage.close();
    await writeFile(
      join(outputDir, "browser-errors.json"),
      JSON.stringify(errors, null, 2),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: English club flow, cycle creation/reordering, whole club, multiple people, Serbian switch, PDF and mobile rendering",
    );
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
