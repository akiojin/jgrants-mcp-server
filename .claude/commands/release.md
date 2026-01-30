---
description: LLMベースのインタラクティブリリースフロー。developブランチで実行し、releaseブランチ経由でmainへPRする（リリースはオーナーのみ）。
---

# /release コマンド
LLMベースのインタラクティブリリースフローです。**developブランチ起点**で実行し、releaseブランチを経由してmainへPRします。**mainへの直接PR/直接pushは禁止**です。

## 権限ルール
- releaseブランチの作成は **オーナーのみ**
- mainへのPRは **release/* ブランチからのみ**
- feature→develop のマージは **オーナーのみ**（レビュー不要）

## 事前チェック
次の条件を満たしていることを確認します。

1. **developブランチで作業している**
2. **ワーキングツリーがクリーン**
3. **タグが最新**

```bash
# 現在のブランチを確認
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo "エラー: /release は develop ブランチで実行してください。"
  echo "現在のブランチ: $CURRENT_BRANCH"
  echo "\n対処: git checkout develop"
  exit 1
fi

# 変更がないか確認
git status --porcelain

# タグを最新化
git fetch --tags origin
```

## Phase 1: 変更点の把握
```bash
# 直近タグの取得（なければ v0.0.0）
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")

# 変更ログ
git log ${LATEST_TAG}..HEAD --oneline

# 変更差分
git diff ${LATEST_TAG}..HEAD --stat
```

### リリースサマリーの下書き
```markdown
## リリースサマリー

### 追加
- [feat: xxx]

### 修正
- [fix: xxx]

### 改善
- [perf/refactor: xxx]

### その他
- [chore/docs/test: xxx]
```

## Phase 2: バージョン決定（SemVer）
| 変更内容 | バージョン | 目安 |
| --- | --- | --- |
| BREAKING CHANGE / feat! | major (X.0.0) | 互換性破壊
| feat | minor (x.Y.0) | 新機能
| fix / perf | patch (x.y.Z) | バグ修正・性能改善
| chore / docs / test / ci | 変更なし or patch | リリース方針に合わせる

### リリース用コミットの型
- **`chore(release):` を使用**
- `feat(release):` は使わない

## Phase 3: リリース内容の確定
AskUserQuestion を使って以下を確定します。
- **新バージョン番号**
- **リリースサマリー**
- **公開対象（npmのみ / GitHub Releaseも作成）**

## Phase 4: バージョン更新
このリポジトリは `package.json` と `package-lock.json` を手動更新します。

```bash
# 例: 0.1.0 -> 0.1.1
npm version 0.1.1 --no-git-tag-version
```

必要なら `CHANGELOG.md` を新規作成または追記します。

```markdown
## [X.Y.Z](https://github.com/akiojin/jgrants-mcp-server/compare/vPREV...vX.Y.Z) (YYYY-MM-DD)

### Features
- ...

### Bug Fixes
- ...
```

## Phase 5: releaseブランチ作成 → PR
**mainへの直接PR/直接pushは禁止**です。必ずreleaseブランチ経由にしてください。

```bash
# releaseブランチ
RELEASE_BRANCH=release/vX.Y.Z

git checkout -b $RELEASE_BRANCH

git add package.json package-lock.json CHANGELOG.md

git commit -m "chore(release): vX.Y.Z\n\nRelease version X.Y.Z\n\nCo-Authored-By: Claude <noreply@anthropic.com>"

# タグ作成
git tag -a vX.Y.Z -m "vX.Y.Z"

# push
git push origin $RELEASE_BRANCH --tags

# PR作成 (release -> main)
gh pr create --base main --head $RELEASE_BRANCH --title "chore(release): vX.Y.Z" --body "$(cat <<'EOF'
## Release vX.Y.Z

[リリースサマリー]

---
Generated with Claude Code
EOF
)"
```

## Phase 6: マージ後の確認
- release→main のPRがマージされる
- mainマージ後、GitHub Actions `publish` が実行される
- npm publish が成功することを確認
- npm上のバージョンを確認

## エラーハンドリング
### 未コミット変更がある
```
エラー: 未コミット変更があります
対応: git status で確認し、コミット/破棄してください
```

### 既に同じタグが存在
```
エラー: vX.Y.Z タグが既に存在します
対応: バージョンを上げるか、既存タグを確認
```

### develop以外で実行
```
エラー: /release は develop ブランチで実行してください
対応: git checkout develop
```

## リリースフロー概要
```
develop -> release/vX.Y.Z -> PR -> main -> GitHub Actions publish -> npm公開
```
