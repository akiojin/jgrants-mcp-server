# AGENTS.md

## 役割
このリポジトリのエージェントは、MCPツールの追加/変更やJ-Grants API仕様変更への追従を行います。

## 進め方
1. 影響範囲を特定（API型/ツール/ファイル変換）
2. 型定義とAPI呼び出しを更新
3. ツールの入出力スキーマを更新
4. 変換処理の追加は `src/files/convert.ts` に集約
5. テストを追加・更新

## 禁止事項
- ツール名や入出力を互換性なく変更しない
- 添付保存フローを省略しない
- stdio以外のトランスポートを追加しない

## 追加時の合意ポイント
- 新ツール名、入力スキーマ、出力スキーマ
- 既存ツールの挙動変更があるか
- 変換処理のフォールバック方針

## ローカル実行
```bash
npm install
npm run build
npm start
```

## リリース
- mainブランチへのマージでnpm publishが実行される
- `package.json` のversionは手動で更新する
- GitHub Secretsに `NPM_TOKEN` が必要
