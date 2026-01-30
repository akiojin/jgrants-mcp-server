import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mime from "mime-types";

export type FileRecord = {
  file_id: string;
  subsidy_id: string;
  category?: string;
  name: string;
  path: string;
  size: number;
  mime?: string;
  created_at: string;
};

export type AddAttachmentInput = {
  subsidyId: string;
  category?: string;
  name: string;
  dataBase64: string;
};

type RegistryData = {
  version: number;
  records: FileRecord[];
};

export class FileRegistry {
  private records = new Map<string, FileRecord>();
  private indexPath: string;

  constructor(
    private readonly baseDir: string,
    private readonly maxBytes: number
  ) {
    this.indexPath = path.join(this.baseDir, "index.json");
  }

  async loadFromDisk(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    try {
      const raw = await fs.readFile(this.indexPath, "utf8");
      const parsed = JSON.parse(raw) as RegistryData | FileRecord[];
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      if (Array.isArray(records)) {
        records.forEach((record) => {
          this.records.set(record.file_id, record);
        });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async saveToDisk(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const payload: RegistryData = {
      version: 1,
      records: Array.from(this.records.values())
    };
    await fs.writeFile(this.indexPath, JSON.stringify(payload, null, 2), "utf8");
  }

  get(fileId: string): FileRecord | undefined {
    return this.records.get(fileId);
  }

  async addAttachment(input: AddAttachmentInput): Promise<FileRecord> {
    const buffer = Buffer.from(input.dataBase64, "base64");
    const size = buffer.byteLength;

    if (size > this.maxBytes) {
      throw new Error(`Attachment exceeds limit: ${size} bytes`);
    }

    const fileId = crypto.randomUUID();
    const safeSubsidy = sanitizeFileName(input.subsidyId || "unknown");
    const safeName = sanitizeFileName(input.name || "attachment");
    const subsidyDir = path.join(this.baseDir, safeSubsidy);
    await fs.mkdir(subsidyDir, { recursive: true });

    const fileName = `${fileId}-${safeName}`;
    const filePath = path.join(subsidyDir, fileName);
    await fs.writeFile(filePath, buffer);

    const mimeType = mime.lookup(safeName) || undefined;

    const record: FileRecord = {
      file_id: fileId,
      subsidy_id: input.subsidyId,
      category: input.category,
      name: safeName,
      path: filePath,
      size,
      mime: typeof mimeType === "string" ? mimeType : undefined,
      created_at: new Date().toISOString()
    };

    this.records.set(fileId, record);
    await this.saveToDisk();

    return record;
  }
}

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/[\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0 ? cleaned : "file";
}
