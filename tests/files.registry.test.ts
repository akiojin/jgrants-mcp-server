import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { FileRegistry } from "../src/files/registry.js";

describe("FileRegistry", () => {
  it("stores attachment and writes index", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jgrants-registry-"));
    try {
      const registry = new FileRegistry(tempDir, 1024 * 1024);
      await registry.loadFromDisk();

      const record = await registry.addAttachment({
        subsidyId: "abc",
        category: "test",
        name: "sample.txt",
        dataBase64: Buffer.from("hello").toString("base64")
      });

      const stored = registry.get(record.file_id);
      expect(stored).toBeTruthy();

      const indexPath = path.join(tempDir, "index.json");
      const raw = await fs.readFile(indexPath, "utf8");
      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed) ? parsed : parsed.records;

      expect(records.length).toBeGreaterThan(0);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("recovers from invalid index.json", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jgrants-registry-"));
    try {
      const indexPath = path.join(tempDir, "index.json");
      await fs.writeFile(indexPath, "{not: \"json\"", "utf8");

      const registry = new FileRegistry(tempDir, 1024 * 1024);
      await registry.loadFromDisk();

      const files = await fs.readdir(tempDir);
      const hasBackup = files.some(
        (name) => name.startsWith("index.invalid-") && name.endsWith(".json")
      );
      expect(hasBackup).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
