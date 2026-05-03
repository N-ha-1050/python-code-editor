# Copilot 指示

## 出力言語

すべての回答・説明・コメント・コミットメッセージなど、エージェントの出力はすべて**日本語**で行ってください。

## プロジェクト概要

このリポジトリは、[Pyodide](https://pyodide.org/)（WebAssembly）を使ってブラウザ上で完全に Python を実行する**ブラウザベースの Python コードエディタ**です。GitHub Pages にデプロイされる静的なシングルページアプリケーションです。バックエンドサーバーはありません。

主な機能:
- [Ace](https://ace.c9.io/) エディタで Python コードを記述・実行
- 標準入力の提供と stdout/stderr の出力表示
- `SharedArrayBuffer` を使った SIGINT 送信による長時間実行コードの中断
- `black` + `isort`（Pyodide 内で `micropip` 経由で実行）によるコードフォーマットとクリップボードへのコピー
- セッションをまたいでコードを `localStorage` に保存
- ディスクへの `.py` ファイルの読み込み・保存

## 技術スタック

| ツール | 用途 |
|---|---|
| TypeScript（ES2024、`"module": "esnext"`） | 全ソースコード |
| Vite | 開発サーバー・バンドラー |
| Ace エディタ（`ace-builds`） | Python シンタックスハイライト付きのブラウザ内エディタ |
| Pyodide | ブラウザ内 Python ランタイム（Web Worker 経由） |
| pnpm（v10） | パッケージマネージャー |
| Biome | リンター・フォーマッター（ESLint + Prettier の代替） |
| Lefthook | Git フック（pre-commit で Biome を実行） |

## リポジトリ構成

```
.
├── index.html              # アプリのエントリーポイント（lang="ja"）
├── src/
│   ├── main.ts             # アプリエントリー; textarea のキーボードショートカット（Ctrl/Cmd+Enter）を設定
│   ├── editor.ts           # Ace エディタのセットアップ、テーマ切り替え、キーボードショートカット
│   ├── python.ts           # run() と formatAndCopy() — 高レベルな UI アクション
│   ├── workerApi.ts        # Worker メッセージプロトコル; runAsync()、interrupt()、formatAsync()
│   ├── runWorker.ts        # Web Worker: Pyodide のロード、Python の実行、中断処理
│   ├── formatWorker.ts     # Web Worker: Pyodide のロード、black+isort のインストール、コードフォーマット
│   ├── elements.ts         # DOM 要素の参照と型ガードヘルパー（isButton、isTextArea、isP）
│   ├── config.ts           # 定数: PYODIDE_INDEX_URL、CODE_LOCALSTORAGE_KEY
│   ├── main.py             # 「新規ファイル」時にエディタに読み込まれるテンプレート Python コード
│   └── style.css           # アプリスタイル
├── public/
│   └── enable-threads.js   # Service Worker 経由で COOP/COEP ヘッダーを設定（SharedArrayBuffer に必要）
├── biome.json              # Biome 設定（リンター・フォーマッター）
├── lefthook.yml            # pre-commit フック: ステージされたファイルを Biome で自動フォーマット
├── tsconfig.json           # TypeScript 設定
├── vite.config.ts          # Vite 設定（開発サーバーに COOP/COEP ヘッダーを設定）
└── .github/workflows/
    ├── deploy.yml          # main へのプッシュ時に GitHub Pages へデプロイ
    └── pull_request.yml    # すべてのプッシュと PR で Biome CI チェックを実行
```

## 開発コマンド

```bash
pnpm i                  # 依存パッケージのインストール
pnpm lefthook install   # git フックのインストール（クローン後に一度だけ実行）
pnpm dev                # 開発サーバーの起動（SharedArrayBuffer に必要な COOP/COEP ヘッダー付き）
pnpm build              # 型チェック（tsc）+ 本番ビルド
pnpm preview            # 本番ビルドのローカルプレビュー
pnpm check              # リント・フォーマットチェック（Biome）
pnpm check:write        # リント・フォーマットの自動修正（Biome）
```

**このプロジェクトにはテストがありません。** CI は `biome ci .`（リント・フォーマットチェック）のみを実行します。

## コードスタイルと規約

**Biome**（`biome.json`）による強制:
- TypeScript/JavaScript の文字列には**ダブルクォート**を使用
- **セミコロンなし**（ASI）
- **スペースインデント**（2 スペース）
- **インポートの自動整理**（Biome assist）

TypeScript の規約（`tsconfig.json`）:
- ターゲット: `ES2024`; lib: `ES2024`、`DOM`
- `verbatimModuleSyntax`: 型のみのインポートには `import type` を使用
- `noUnusedLocals` と `noUnusedParameters` が有効 — 未使用のシンボルは削除すること
- `erasableSyntaxOnly`: TypeScript 固有のエミットを生成する構文（例: `const enum`）は避けること
- モジュール解決: `bundler`（Vite）

DOM 要素へのアクセスパターン（`elements.ts` 参照）:
- `document.getElementById()` で要素を取得してエクスポート
- 使用前に必ずエクスポートされた型ガード（`isButton`、`isTextArea`、`isP`）で検証すること

Worker の通信パターン（`workerApi.ts` 参照）:
- 各リクエストには `crypto.randomUUID()` で生成した id を付与
- レスポンスリスナーが id を確認し、`Promise.withResolvers()` の Promise を resolve する
- Worker のメッセージ型は `type` フィールドを持つ判別共用体を使用

`editor.ts` のキーボードショートカットは必ず `win: "Ctrl-*"` と `mac: "Command-*"` の**両方**のバインディングを定義すること。

## アーキテクチャメモ

### Python の実行
- UI をブロックしないよう、Python は専用の **Web Worker**（`runWorker.ts`）で実行
- 中断は `SharedArrayBuffer` + `Uint8Array` で実装 — `interruptBuffer[0] = 2` を設定すると Pyodide に SIGINT が送信される
- `SharedArrayBuffer` には `Cross-Origin-Opener-Policy: same-origin` と `Cross-Origin-Embedder-Policy: require-corp` ヘッダーが必要 — 開発時は `vite.config.ts`、本番は `public/enable-threads.js`（Service Worker）で設定
- Pyodide は `loadPackagesFromImports()` でコード実行前にインポートからパッケージを自動ロードする

### コードフォーマット
- フォーマットは別の **Web Worker**（`formatWorker.ts`）で実行
- Pyodide の `micropip` 経由で実行時に `black` + `isort` をインストール（初回は遅い）
- フォーマット後、結果を Ace エディタに書き戻し、クリップボードにもコピーする

### エディタの永続化
- コードは編集のたびに `localStorage` に保存（キー: `config.ts` の `"code"`）
- `src/main.py` は Vite の `?raw` インポートで生文字列としてバンドルされ、「新規ファイル」のテンプレートとして使用される

## CI/CD

- **`pull_request.yml`**: すべてのプッシュと PR で `biome ci .` を実行。マージ前に通過必須。
- **`deploy.yml`**: `main` へのプッシュ時にビルドして **GitHub Pages** にデプロイ。

プッシュ前に必ず `pnpm check`（または `pnpm check:write` で自動修正）を実行してください。pre-commit の Lefthook もステージされた `.ts/.json` 等のファイルに対して自動的に実行されます。

## 既知のエラーと回避策

- **`SharedArrayBuffer` が利用不可**: `COOP`/`COEP` ヘッダーなしでページを配信すると `SharedArrayBuffer` が `undefined` になり、中断機能が動作しません。`enable-threads.js` の Service Worker は、カスタムヘッダーを設定できない GitHub Pages のための回避策です。
- **フォーマット時の Pyodide パッケージインストール**: 「Format & Copy」の初回呼び出し時に Web Worker 内で `micropip` を使って `black` と `isort` をインストールするため、数秒かかります。以降の呼び出しは既にロード済みの Worker を再利用するため高速です。
