import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { API_BASE_URL, JGRANTS_FILES_DIR, MAX_ATTACHMENT_BYTES } from "./config.js";
import { fetchSubsidies, fetchSubsidyDetail } from "./jgrants/api.js";
import { FileRegistry } from "./files/registry.js";
import { convertFileToMarkdown } from "./files/convert.js";
import { registerTools } from "./tools.js";

async function main(): Promise<void> {
  const registry = new FileRegistry(JGRANTS_FILES_DIR, MAX_ATTACHMENT_BYTES);
  await registry.loadFromDisk();

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

main().catch((error) => {
  console.error("MCP server failed to start", error);
  process.exitCode = 1;
});
