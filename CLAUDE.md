# CLAUDE.md

## 目的
このリポジトリはJ-Grants公開APIをMCPツールとして提供するNode.jsサーバーです。検索・詳細取得・添付ファイル保存/変換を提供します。

## アーキテクチャ概要
- API層: `src/jgrants` がJ-Grants API呼び出しとレスポンス型を担当
- ファイル層: `src/files` が添付保存とMarkdown変換を担当
- MCP層: `src/tools.ts` がツール登録、`src/index.ts` がstdio起動を担当

## ディレクトリ
- `src/index.ts`: MCPサーバー起動（stdio）
- `src/tools.ts`: MCPツール定義とハンドラ
- `src/jgrants/api.ts`: API呼び出し
- `src/jgrants/types.ts`: APIレスポンス型
- `src/files/registry.ts`: 添付保存とインデックス
- `src/files/convert.ts`: Markdown変換
- `tests/`: ユニットテスト

## 守るべき制約
- `search_subsidies` は必須パラメータを補完すること（keyword長など）
- stdioトランスポートのみ使用（HTTPは使わない）
- 添付変換はJSのみで行い、外部CLIに依存しない
- `JGRANTS_FILES_DIR` に添付保存、`index.json` に登録情報を保存

## 開発コマンド
```bash
npm install
npm run dev
npm run build
npm run start
npm run test
```

## エラーハンドリング方針
- API失敗はツールで `isError: true` を返す
- 添付が保存できない場合は警告として返し、処理は継続
- Markdown変換に失敗した場合はBASE64にフォールバック

## 変更時チェックリスト
- APIパラメータのデフォルト補完が維持されているか
- 添付保存後に `index.json` が更新されるか
- `get_file_content` がMarkdown/BASE64両対応か
- `npm run test` が通るか
