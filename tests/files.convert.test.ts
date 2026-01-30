import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { convertFileToMarkdown } from "../src/files/convert.js";

describe("convertFileToMarkdown", () => {
  it("converts txt to markdown", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jgrants-convert-"));
    const filePath = path.join(tempDir, "sample.txt");
    try {
      await fs.writeFile(filePath, "hello world", "utf8");
      const result = await convertFileToMarkdown(filePath);
      expect(result.markdown).toContain("hello world");
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("falls back to base64 for unsupported", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "jgrants-convert-"));
    const filePath = path.join(tempDir, "sample.bin");
    try {
      await fs.writeFile(filePath, Buffer.from([1, 2, 3]));
      const result = await convertFileToMarkdown(filePath);
      expect(result.base64).toBeTruthy();
      expect(result.warning).toBeTruthy();
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
