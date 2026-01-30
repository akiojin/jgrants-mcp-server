# jgrants-mcp-server

J-Grants (jGrants) 公開APIをMCPツールとして提供するNode.jsサーバーです。補助金の検索・詳細取得に加え、添付ファイルを保存してMarkdownに変換します。

## 必要環境
- Node.js 18+
- npm

## セットアップ
```bash
npm install
npm run build
```

## 起動（stdio）
```bash
npm start
```

## npxで起動（stdio）
```bash
npx -y @akiojin/jgrants-mcp-server
```

## MCPツール
- `ping`
- `search_subsidies`
- `get_subsidy_detail`
- `get_file_content`

## 環境変数
- `API_BASE_URL` (default: `https://api.jgrants-portal.go.jp/exp/v1/public`)
- `JGRANTS_FILES_DIR` (default: `./jgrants_files`)
- `MAX_ATTACHMENT_BYTES` (default: 26214400)

## Claude Desktop設定例（stdio）
```json
{
  "mcpServers": {
    "jgrants": {
      "command": "node",
      "args": ["E:/jgrants-mcp-server/dist/index.js"],
      "env": {
        "JGRANTS_FILES_DIR": "E:/jgrants-mcp-server/jgrants_files"
      }
    }
  }
}
```

## 免責
- 本サーバーはJ-Grants公開APIを利用します。利用規約や公開範囲に従ってご利用ください。
- APIの仕様変更により、挙動が変わる可能性があります。
