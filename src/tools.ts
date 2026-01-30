import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Attachment, SubsidyDetailResponse } from "./jgrants/types.js";
import type { SearchParams } from "./jgrants/api.js";
import type { FileRegistry } from "./files/registry.js";
import type { ConvertResult } from "./files/convert.js";

export type ToolDeps = {
  fetchSubsidies: (params: SearchParams) => Promise<unknown>;
  fetchSubsidyDetail: (id: string) => Promise<SubsidyDetailResponse>;
  registry: FileRegistry;
  convertFileToMarkdown: (filePath: string, mime?: string) => Promise<ConvertResult>;
};

export function registerTools(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "ping",
    {
      description: "Health check"
    },
    async () => ({
      content: [{ type: "text", text: "ok" }],
      structuredContent: { status: "ok", version: "0.1.0" }
    })
  );

  const searchInput = z
    .object({
      keyword: z.string().optional(),
      sort: z
        .enum([
          "created_date",
          "acceptance_start_datetime",
          "acceptance_end_datetime"
        ])
        .optional(),
      order: z.enum(["ASC", "DESC"]).optional(),
      acceptance: z.union([z.literal(0), z.literal(1)]).optional(),
      use_purpose: z.string().optional(),
      industry: z.string().optional(),
      target_number_of_employees: z.string().optional(),
      target_area_search: z.string().optional()
    })
    .partial();

  server.registerTool(
    "search_subsidies",
    {
      description: "Search subsidies from J-Grants public API",
      inputSchema: searchInput
    },
    async (params) => {
      try {
        const data = await deps.fetchSubsidies(params as SearchParams);
        return {
          content: [{ type: "text", text: "ok" }],
          structuredContent: data as Record<string, unknown>
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `search_subsidies failed: ${(error as Error).message}`
            }
          ]
        };
      }
    }
  );

  server.registerTool(
    "get_subsidy_detail",
    {
      description: "Get subsidy detail by id",
      inputSchema: z.object({
        id: z.string(),
        include_file_data: z.boolean().optional()
      })
    },
    async ({ id, include_file_data }) => {
      try {
        const response = await deps.fetchSubsidyDetail(id);
        const detail = response.result;

        if (!detail || !detail.attachments) {
          return {
            content: [{ type: "text", text: "ok" }],
            structuredContent: response as Record<string, unknown>
          };
        }

        const attachments = detail.attachments as Attachment[];
        const savedAttachments = [] as Array<Record<string, unknown>>;
        const warnings: string[] = [];

        for (const attachment of attachments) {
          try {
            const record = await deps.registry.addAttachment({
              subsidyId: id,
              category: attachment.category,
              name: attachment.name,
              dataBase64: attachment.data
            });

            const output: Record<string, unknown> = {
              file_id: record.file_id,
              name: record.name,
              category: record.category,
              size: record.size,
              mime: record.mime
            };

            if (include_file_data) {
              output.data = attachment.data;
            }

            savedAttachments.push(output);
          } catch (error) {
            warnings.push(
              `Attachment ${attachment.name} skipped: ${(error as Error).message}`
            );
          }
        }

        const updatedResult = {
          ...detail,
          attachments: savedAttachments
        };

        const enriched = {
          ...response,
          result: updatedResult,
          file_warnings: warnings.length > 0 ? warnings : undefined
        };

        return {
          content: [{ type: "text", text: "ok" }],
          structuredContent: enriched as Record<string, unknown>
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `get_subsidy_detail failed: ${(error as Error).message}`
            }
          ]
        };
      }
    }
  );

  server.registerTool(
    "get_file_content",
    {
      description: "Get stored attachment content as markdown or base64",
      inputSchema: z.object({
        file_id: z.string(),
        format: z.enum(["markdown", "base64"]).optional()
      })
    },
    async ({ file_id, format }) => {
      const record = deps.registry.get(file_id);
      if (!record) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `file_id not found: ${file_id}`
            }
          ]
        };
      }

      try {
        if (format === "base64") {
          const base64 = await fileToBase64(record.path);
          return {
            content: [
              {
                type: "text",
                text: "ok"
              }
            ],
            structuredContent: {
              file_id,
              name: record.name,
              mime: record.mime,
              base64
            }
          };
        }

        const result = await deps.convertFileToMarkdown(record.path, record.mime);
        return {
          content: [
            {
              type: "text",
              text: "ok"
            }
          ],
          structuredContent: {
            file_id,
            name: record.name,
            mime: record.mime,
            markdown: result.markdown,
            base64: result.base64,
            warning: result.warning
          }
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `get_file_content failed: ${(error as Error).message}`
            }
          ]
        };
      }
    }
  );
}

async function fileToBase64(filePath: string): Promise<string> {
  const { promises: fs } = await import("node:fs");
  const data = await fs.readFile(filePath);
  return data.toString("base64");
}
