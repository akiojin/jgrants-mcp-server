import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import os from "node:os";
import path from "node:path";
import { API_BASE_URL, JGRANTS_FILES_DIR, MAX_ATTACHMENT_BYTES } from "./config.js";
import { fetchSubsidies, fetchSubsidyDetail } from "./jgrants/api.js";
import { FileRegistry } from "./files/registry.js";
import { convertFileToMarkdown } from "./files/convert.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const registry = await createRegistry();

  const server = new McpServer({
    name: "jgrants-mcp",
    version: "0.1.0"
  });

  registerTools(server, {
    fetchSubsidies: (params) => fetchSubsidies(params, API_BASE_URL),
    fetchSubsidyDetail: (id) => fetchSubsidyDetail(id, API_BASE_URL),
    registry,
    convertFileToMarkdown
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function createRegistry(): Promise<FileRegistry> {
  const primary = new FileRegistry(JGRANTS_FILES_DIR, MAX_ATTACHMENT_BYTES);
  try {
    await primary.loadFromDisk();
    return primary;
  } catch (error) {
    if (!isPermissionError(error)) {
      throw error;
    }
    const fallbackDir = path.join(os.homedir(), ".jgrants-mcp", "files");
    console.error(
      `JGRANTS_FILES_DIR is not writable: ${JGRANTS_FILES_DIR}. Falling back to ${fallbackDir}.`,
      error
    );
    const fallback = new FileRegistry(fallbackDir, MAX_ATTACHMENT_BYTES);
    await fallback.loadFromDisk();
    return fallback;
  }
}

function isPermissionError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  return code === "EACCES" || code === "EPERM" || code === "EROFS" || code === "ENOTDIR";
}

main().catch((error) => {
  console.error("MCP server failed to start", error);
  process.exitCode = 1;
});
