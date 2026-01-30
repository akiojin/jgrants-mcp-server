import { promises as fs } from "node:fs";
import { Buffer } from "node:buffer";
import path from "node:path";
import mime from "mime-types";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";

export type ConvertResult = {
  markdown?: string;
  base64?: string;
  warning?: string;
};

const SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx", ".txt"]);

export async function convertFileToMarkdown(
  filePath: string,
  mimeType?: string
): Promise<ConvertResult> {
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeType || mime.lookup(filePath) || undefined;

    if (ext === ".txt" || type === "text/plain") {
      const text = buffer.toString("utf8");
      return { markdown: normalizeText(text) };
    }

    if (ext === ".pdf") {
      const parsed = await parsePdfText(buffer);
      return { markdown: normalizeText(parsed) };
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return { markdown: normalizeText(result.value) };
    }

    if (ext === ".xlsx") {
      const markdown = await xlsxBufferToMarkdown(buffer, "##");
      return { markdown: markdown.trim() };
    }

    if (ext === ".zip") {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const sections: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const entryExt = path.extname(entry.entryName).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(entryExt)) continue;

        const entryBuffer = entry.getData();
        const sectionHeader = `## ${entry.entryName}`;

        if (entryExt === ".txt") {
          sections.push(
            `${sectionHeader}\n\n${normalizeText(entryBuffer.toString("utf8"))}`
          );
          continue;
        }

        if (entryExt === ".pdf") {
          const parsed = await parsePdfText(entryBuffer);
          sections.push(`${sectionHeader}\n\n${normalizeText(parsed)}`);
          continue;
        }

        if (entryExt === ".docx") {
          const result = await mammoth.extractRawText({ buffer: entryBuffer });
          sections.push(`${sectionHeader}\n\n${normalizeText(result.value)}`);
          continue;
        }

        if (entryExt === ".xlsx") {
          const markdown = await xlsxBufferToMarkdown(entryBuffer, "###");
          sections.push(`${sectionHeader}\n\n${markdown}`);
        }
      }

      if (sections.length > 0) {
        return { markdown: sections.join("\n\n") };
      }
    }

    return {
      base64: buffer.toString("base64"),
      warning: "Unsupported file type for markdown conversion"
    };
  } catch (error) {
    try {
      const buffer = await fs.readFile(filePath);
      return {
        base64: buffer.toString("base64"),
        warning: `Conversion failed: ${(error as Error).message}`
      };
    } catch {
      return { warning: `Conversion failed: ${(error as Error).message}` };
    }
  }
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function rowsToMarkdown(rows: Array<Array<unknown>>): string {
  if (rows.length === 0) return "";
  const header = rows[0].map(cellToString);
  const separator = header.map(() => "---");
  const body = rows.slice(1).map((row) => row.map(cellToString));

  const lines = [header, separator, ...body].map(
    (row) => `| ${row.join(" | ")} |`
  );
  return lines.join("\n");
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.replace(/\r?\n/g, " ").trim();
  return String(value);
}

async function parsePdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function xlsxBufferToMarkdown(
  buffer: Buffer | Uint8Array,
  headingPrefix: "##" | "###"
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const normalized = Buffer.from(buffer);
  await workbook.xlsx.load(normalized as any);

  const sections: string[] = [];
  for (const sheet of workbook.worksheets) {
    const rows: Array<Array<unknown>> = [];
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values.map(normalizeCellValue));
    });

    const table = rowsToMarkdown(rows);
    if (table) {
      sections.push(`${headingPrefix} ${sheet.name}\n\n${table}`);
    }
  }

  return sections.join("\n\n");
}

function normalizeCellValue(value: unknown): unknown {
  if (!value) return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (Array.isArray(record.richText)) {
      return record.richText
        .map((item) =>
          typeof item === "object" && item && "text" in item
            ? String((item as { text?: string }).text ?? "")
            : ""
        )
        .join("");
    }
    if (typeof record.hyperlink === "string" && typeof record.text === "string") {
      return `${record.text} (${record.hyperlink})`;
    }
  }
  return value;
}
