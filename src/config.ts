import path from "node:path";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://api.jgrants-portal.go.jp/exp/v1/public";

const JGRANTS_FILES_DIR =
  process.env.JGRANTS_FILES_DIR ?? path.resolve("jgrants_files");

const maxBytesEnv = Number.parseInt(
  process.env.MAX_ATTACHMENT_BYTES ?? "",
  10
);

const MAX_ATTACHMENT_BYTES = Number.isFinite(maxBytesEnv)
  ? maxBytesEnv
  : 25 * 1024 * 1024;

export { API_BASE_URL, JGRANTS_FILES_DIR, MAX_ATTACHMENT_BYTES };
