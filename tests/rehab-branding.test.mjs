import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { reportLogoUrl, CLINIC_REPORT_LOGO, MAX_CLUB_LOGO_BYTES } from "../src/lib/rehab/branding.ts";
import { prepareClubLogo } from "../src/lib/rehab/logo-upload.ts";
import { createRehabTestDb, seedRehabTestDb, asUser, ids } from "./helpers/rehab-db.mjs";

const path = `${ids.club}/10000000-0000-4000-8000-000000000001.png`;
test("clinic branding is fixed and club branding never falls back to the clinic or another club", () => {
  assert.equal(reportLogoUrl({ id: ids.clinic, kind: "clinic", logo_path: path }), CLINIC_REPORT_LOGO);
  assert.equal(reportLogoUrl({ id: ids.club, kind: "club" }), null);
  assert.equal(reportLogoUrl({ id: ids.clubB, kind: "club", logo_path: path }, "https://test.invalid"), null);
  assert.equal(reportLogoUrl({ id: ids.club, kind: "club", logo_path: path }, "https://test.invalid/"), `https://test.invalid/storage/v1/object/public/rehab-club-logos/${path}`);
});

test("logo uploads decode real images and retain proportions and transparency; invalid inputs fail", async () => {
  const png = await sharp({ create: { width: 1600, height: 800, channels: 4, background: { r: 10, g: 100, b: 80, alpha: 0.5 } } }).png().toBuffer();
  const result = await prepareClubLogo(new File([png], "logo.png", { type: "image/png" }));
  const meta = await sharp(result).metadata();
  assert.equal(meta.width, 800);
  assert.equal(meta.height, 400);
  assert.equal(meta.hasAlpha, true);
  for (const file of [
    new File(["not an image"], "bad.png", { type: "image/png" }),
    new File(["<svg/>"], "bad.svg", { type: "image/svg+xml" }),
    new File([], "empty.png", { type: "image/png" }),
    new File([new Uint8Array(MAX_CLUB_LOGO_BYTES + 1)], "large.png", { type: "image/png" }),
  ]) await assert.rejects(prepareClubLogo(file), /invalidClubLogo/);
});

test("database isolates logos by club and restricts branding changes to the main administrator", async () => {
  const db = await createRehabTestDb();
  try {
    await seedRehabTestDb(db);
    await db.exec("grant select, insert, delete on storage.objects to authenticated");
    await asUser(db, ids.admin);
    await db.query("update rehab_workspaces set logo_path=$1 where id=$2", [path, ids.club]);
    await assert.rejects(db.query("update rehab_workspaces set logo_path=$1 where id=$2", [path, ids.clinic]));
    await assert.rejects(db.query("update rehab_workspaces set logo_path=$1 where id=$2", [path, ids.clubB]));
    await db.query("insert into storage.objects(bucket_id,name) values('rehab-club-logos',$1)", [path]);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('rehab-club-logos',$1)", [`${ids.clinic}/logo.png`]));
    for (const actor of [ids.viewer, ids.player, ids.therapist, ids.viewerB]) {
      await asUser(db, actor);
      assert.equal((await db.query("update rehab_workspaces set logo_path=null where id=$1 returning id", [ids.club])).rows.length, 0);
      await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('rehab-club-logos',$1)", [path]));
    }
    await asUser(db, ids.player);
    assert.equal((await db.query("select logo_path from rehab_workspaces where id=$1", [ids.club])).rows[0].logo_path, path);
    assert.equal((await db.query("select logo_path from rehab_workspaces where id=$1", [ids.clubB])).rows.length, 0);
  } finally { await db.close(); }
});
