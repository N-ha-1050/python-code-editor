---
title: "Note"
author: "N_ha"
---

## セットアップ

### プロジェクト作成

```powershell
pnpm create vite .
```

- `Select a framework:` →  `Vanilla`
- `Select a variant:` → `TypeScript`
- `Install with pnpm and start now?` → `Yes`

### Lefthook のインストール

```powershell
pnpm add -D lefthook
pnpm approve-builds lefthook
```

`pnpm-workspace.yaml` に以下を追加

```yaml
onlyBuiltDependencies:
  - lefthook
```

### Biome

```powershell
pnpm add -D -E @biomejs/biome
pnpx @biomejs/biome init
```

#### Biome の設定

<https://biomejs.dev/ja/reference/configuration/>

`biome.json` に以下を追加

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "asNeeded"
    }
  },
  "html": {
    "formatter": {
      "enabled": true
    }
  },
  "css": {
    "formatter": {
      "enabled": true
    }
  }
}
```

#### Biome VSCode 拡張機能

<https://biomejs.dev/ja/reference/vscode/>

`.vscode/settings.json` に以下を追加

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "biome.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[css]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[html]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

#### Biome の script の追加

`package.json` に以下を追加

```json
{
    "scripts": {
        "check": "biome check",
        "check:write": "biome check --write",
    }
}
```

#### 継続的インテグレーション

<https://biomejs.dev/ja/recipes/continuous-integration/>

`.github/workflows/pull_request.yml` に以下を追加

```yaml
name: Code quality

on:
  push:
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          persist-credentials: false
      - name: Setup Biome
        uses: biomejs/setup-biome@v2
        with:
          version: latest
      - name: Run Biome
        run: biome ci .
```

#### git hooks

<https://biomejs.dev/ja/recipes/git-hooks/>

`lefthook.yml` に以下を追加

```yaml
pre-commit:
  commands:
    check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}"
      run: pnpx @biomejs/biome check --write --no-errors-on-unmatched --files-ignore-unknown=true --colors=off {staged_files}
      stage_fixed: true
```

`pnpm lefthook install` を実行

### Github Pages へのデプロイ設定

<https://ja.vite.dev/guide/static-deploy>

`vite.config.ts` を編集（デフォルト値を利用するので省略）

`.github/workflows/deploy.yml` に以下を追加

```yaml
# Simple workflow for deploying static content to GitHub Pages
name: Deploy static content to Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ['main']

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets the GITHUB_TOKEN permissions to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow one concurrent deployment
concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  # Single deploy job since we're just deploying
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Set up Node
        uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: 'pnpm'
      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm run build
      - name: Setup Pages
        uses: actions/configure-pages@v6
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          # Upload dist folder
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```
