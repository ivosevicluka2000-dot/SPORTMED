import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createTranslator } from "next-intl";
const sr = JSON.parse(
  await readFile(new URL("../messages/sr.json", import.meta.url)),
);
const en = JSON.parse(
  await readFile(new URL("../messages/en.json", import.meta.url)),
);
test("rehab translations have matching keys and valid ICU interpolation", () => {
  assert.deepEqual(Object.keys(sr.rehab).sort(), Object.keys(en.rehab).sort());
  for (const [locale, messages] of [
    ["sr", sr],
    ["en", en],
  ]) {
    const t = createTranslator({
      locale,
      messages,
      namespace: "rehab",
      onError: (error) => {
        throw error;
      },
    });
    for (const key of Object.keys(messages.rehab))
      assert.equal(
        typeof t(key, {
          v0: "Test",
          v1: "Email",
          v2: "Scope",
          count: 3,
          total: 5,
        }),
        "string",
      );
  }
});
test("all literal rehab translation calls and known error messages have catalogue entries", async () => {
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith(".tsx")) {
        const text = await readFile(file, "utf8");
        for (const match of text.matchAll(/\bt\("([^"]+)"/g))
          assert.ok(en.rehab[match[1]], `${file.pathname}: ${match[1]}`);
      }
    }
  }
  for (const path of [
    "../src/components/rehab/",
    "../src/app/[locale]/rehab/",
    "../src/app/[locale]/admin/rehab/",
  ])
    await walk(new URL(path, import.meta.url));
  const keys = JSON.parse(
    await readFile(
      new URL("../src/lib/rehab/message-keys.json", import.meta.url),
    ),
  );
  for (const key of Object.values(keys)) assert.ok(en.rehab[key], key);
});
