# 個人ブログ再構築 — 実装計画

要件・仕様は同じディレクトリの `blog-spec.md` を参照。こちらは**進め方**のみを扱う。

- 作成日: 2026-08-31
- 進捗は各チェックボックスを埋めながら進める

---

## 進め方の原則

1. **各フェーズの終わりに、必ず目で見える確認をする。** 完了条件を満たさないまま次へ進まない
2. **1フェーズ = だいたい1セッション。** 途中で切れてもこのファイルを見れば再開できる
3. **外部サービスを触るフェーズ（5以降）は、実行前に必ず確認を取る。** GitHub リポジトリ作成、
   Vercel 連携、ドメイン変更は取り消しに手間がかかる
4. **未検証事項はそれが必要になるフェーズで潰す。** 前倒しで全部調べない
   （ただし Keystatic の別リポジトリ対応だけは構成の前提なので Phase 0 で確認する）

### なぜこの順番か
デプロイ（Phase 5）を、記事リポジトリの分離（Phase 6）より**前**に置いている。
逆にすると「submodule の問題なのか Vercel の設定なのか」の切り分けができなくなるため。
まず単一リポジトリで確実に本番を通し、そのあと分離する。

---

## Phase 0 — 決める（実装なし） ✅ 完了（2026-08-31）

着手前に潰しておく判断。ここが決まらないと後で手戻りする。

- [x] **プロジェクトディレクトリ名を決める** → `ws/my-blog-2`
- [x] **`ws/blog` を content リポジトリ本体にするか** → **しない。`ws/blog-content` を新設する**
      `ws/blog` は Git 管理しない下書き置き場のまま残し、公開する記事だけを content リポジトリへ移す。
      → 帰結: 「書く → push → 公開」が一直線にはならず、`ws/blog` → content リポジトリの
        受け渡し工程が残る。Phase 8 でここの導線を決める
- [x] **既存 microCMS 記事を移行するか** → **しない**
      md が生テキストで表示されている状態の記事であり、持ち込む価値が薄い。
      新ブログは `ws/blog` の4記事から再スタートする。→ Phase 8 の移行作業は不要
- [x] **独自ドメイン／既存 URL を引き継ぐか** → **引き継がない。Vercel 発行の URL を使う**
      既存 Gatsby の `siteUrl` は Gatsby スターターの初期値のままで、独自ドメイン設定の形跡なし。
      → Phase 8 のドメイン切替・旧 URL リダイレクトは不要。独自ドメインは後からいつでも足せる
- [x] **Keystatic の `storage` をサイトとは別リポジトリに向けられるか** → **向けられる**
      `storage: { kind: 'github', repo: { owner, name } }` の `repo` は単なる `owner/name` 指定で、
      公式ドキュメントに「サイトと同一リポジトリであること」という要件は無い。
      構成4の前提は維持できる。ただし調査で前提が2つ増えた（下記）

### Phase 0 の調査で判明した追加の前提

1. **Keystatic の GitHub モードは Node.js が動く API ルートを要求する。**
   静的出力のみの Astro では成立しない。Phase 7 で `@astrojs/vercel` アダプタを入れて
   Keystatic の管理画面と OAuth コールバックだけサーバ側で動かす構成にする
   （環境変数 4つ: `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` /
   `KEYSTATIC_SECRET` / `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`）
2. **Keystatic のコミット先と submodule のポインタがズレる。**
   Keystatic は content リポジトリへ直接コミットするが、submodule はコミットを固定するため、
   content 側への push だけではサイト側のビルドは新しい記事を拾わない。
   サイト側の submodule ポインタを進める導線（GitHub Actions + Vercel Deploy Hook 等）が要る。
   → Phase 6 の最後の項目と Phase 7 がここで繋がる。Phase 6 で先に潰しておく

**完了条件**: 上記すべてに答えが出ている → **達成**

---

## Phase 1 — ローカルで Astro が動く ✅ 完了（2026-08-31）

- [x] プロジェクトディレクトリを作成 → `ws/my-blog-2`（計画ドキュメント2つが既にあったため、
      一度 `_init/` に生成してからルートへ移動した）
- [x] `npm create astro@latest _init -- --template blog --install --no-git --skip-houston --yes`
      → **Astro 7.2.9**（Node v22.14.0 / npm 10.9.2 で要件 node>=22.12.0 を満たす）
- [x] 雛形付属のサンプル記事を削除（`src/content/blog/` の 5 ファイル）
- [x] `src/consts.ts` の `SITE_TITLE` / `SITE_DESCRIPTION` を実際の値に
      → `Teru's Blog` / 「手を動かして学んだことを、そのまま記事にしていくブログ。」
- [x] `astro.config.mjs` の `site` を仮の URL に → `https://my-blog-2.vercel.app`（Phase 5 で差し替え）
- [x] 各ページの `<html lang="en">` を `lang="ja"` に（`.astro` 3ファイル）
- [x] **日本語フォントの手当て** → `global.css` の `body` に OS 同梱ゴシックのフォールバックを追加
      （Hiragino Sans / Yu Gothic / Meiryo / Noto Sans JP）
- [x] `npm run dev` で起動し、**ブラウザで日本語が正しく表示されることを確認**
      → トップページの日本語が豆腐にならずに表示。`/blog`（記事0本）もエラーなく描画。
        コンソールエラーなし

**完了条件**: トップページが開き、日本語が豆腐（□）にならずに表示される → **達成**

### Phase 1 での判断メモ

- **和文は Web フォントではなく OS 同梱フォントにフォールバックさせた。**
  Astro 7 の Fonts API で Noto Sans JP を配信する手もあるが、CJK は
  サブセットが巨大で、`subsets` に `japanese` を明示しないとかえって豆腐になる。
  Phase 1 の目的（日本語が読める状態にする）には過剰なので、まずはシステムフォントで通す。
  意匠として和文 Web フォントを入れたくなったら Phase 3 で再検討する
- 雛形の `index.astro` の本文は英語のサンプル文だったため、日本語の文面に差し替えた
  （サンプル記事を消すと日本語が1文字も無くなり、完了条件を確認できないため）
- Footer の `Your name here` を `Teru` に変更
- **Header / Footer のソーシャルリンクは Astro 公式アカウントのまま。** 本人のアカウントに
  差し替えるか、消すかは未決（Phase 3 の体裁整えで扱う）

## Phase 2 — 既存記事の取り込み

このフェーズが今回の山場。`ws/blog` の md には frontmatter が無い（詳細は spec の5節）。

- [ ] `content/blog/` をプロジェクトルート直下に作成
- [ ] `src/content.config.ts` の glob `base` を `./content/blog` に変更
- [ ] **`base` が `src/` の外でも解決できるか、この時点で確認する**（未検証事項）
- [ ] スキーマを更新: `draft` (default false) と `tags` (default []) を追加、`description` を任意に
- [ ] `scripts/import-posts.mjs` を作成
      - タイトル = 最初の H1、無ければ最初の非空行
      - タイトル行は本文から除去（レイアウトが h1 を出すため）
      - 日付 = ファイル名の `YYYY-MM-DD-` プレフィックス、無ければ mtime
      - スラッグ = ファイル名から日付プレフィックスを除去
      - 相対 md リンク `./xxx.md` → `/blog/<slug>/` に張り替え
      - **既存ファイルは上書きしない**（`--force` のときだけ）
      - frontmatter がすでにあるファイルは素通し（冪等）
      - `.md` のみ対象。`.html` は無視
- [ ] 取り込みを実行
- [ ] **4記事すべてをブラウザで開いて確認**
      - [ ] タイトルが二重に出ていないか（H1 除去の確認）
      - [ ] 日付なし2本（`claude-code-with-playwright-mcp` / `jamstack-blog`）が妥当な日付になっているか
      - [ ] タイトルが H1 でない2本のタイトルが正しく拾えているか
      - [ ] 記事間リンクが `/blog/<slug>/` になり、リンク先が開くか
      - [ ] コードブロックが崩れていないか

**完了条件**: 既存4記事が一覧に並び、すべて開けて内容が崩れていない

---

## Phase 3 — ブログとしての体裁

- [ ] **draft フィルタを実装**（`import.meta.env.PROD` で除外）
      - [ ] 一覧ページ
      - [ ] 記事ページの `getStaticPaths`
      - [ ] RSS
      - ※ 3箇所すべて。漏れやすいので `src/lib/posts.ts` に集約する
- [ ] `draft: true` の記事を作って、dev で見えて build で消えることを確認
- [ ] タグの表示（一覧・記事）
- [ ] 目次（TOC）※ 既存 Gatsby にあった機能。要否を判断
- [ ] コードブロックのシンタックスハイライト確認（Astro は Shiki を標準搭載）
- [ ] OGP / メタタグ / `<title>`
- [ ] RSS・sitemap・404 の動作確認
- [ ] **`npm run build` が通ることを確認**

**完了条件**: 本番ビルドが成功し、`npm run preview` で一通り閲覧できる

---

## Phase 4 — 画像

- [ ] `content/blog/images/` に実際のスクショを1枚置く
- [ ] 記事から相対パスで参照
- [ ] **相対パス画像に Astro の画像最適化が効くか確認**（未検証事項）
- [ ] `heroImage` の動作確認
- [ ] ビルド後の出力サイズを見て、容量方針（同梱のままで良いか）を再確認

**完了条件**: 記事に画像が表示され、ビルドが通る

---

## Phase 5 — デプロイ（★外部アクション）

**このフェーズから実行前に確認を取ること。**

- [x] `git init` + 初回コミット → **Phase 1 完了時点に前倒しで実施**（2026-08-31 / `main` / `b3f92af`）
      ※ `user.email` が `you@example.com` のままだったため、このリポジトリだけローカル設定で修正
- [ ] GitHub リポジトリを作成（★確認）
- [ ] Vercel プロジェクトを作成し連携（★確認）
- [ ] 本番ビルドが Vercel 上で通る
- [ ] ブランチを切って PR を作り、**Preview Deployment の URL が発行されることを確認**（要件①）
- [ ] `astro.config.mjs` の `site` を実際の URL に更新

**完了条件**: 本番 URL で閲覧でき、PR ごとにプレビュー URL が出る

---

## Phase 6 — 記事リポジトリの分離（★外部アクション）

要件④の本体。Phase 5 が安定してから着手する。

- [ ] content リポジトリ用のディレクトリ `ws/blog-content` を新設し、GitHub リポジトリを作成（★確認）
      ※ `ws/blog` は下書き置き場として残す（Phase 0 の決定）
- [ ] `content/blog` の中身を `ws/blog-content` へ移す
- [ ] サイト側の `content/blog` を submodule として繋ぐ
- [ ] ローカルでビルドが通る
- [ ] **Vercel 上で submodule 込みのビルドが通るか確認**（未検証事項）
      → 詰まる場合は content リポジトリを public にする、または
        GitHub Actions で両方 checkout する方式に切り替え
- [ ] **記事だけを更新したときにサイトが再ビルドされる導線を作る**（Phase 0 の追加前提2）
      submodule はコミットを固定するため、content への push だけではサイトは更新されない。
      content リポジトリの GitHub Actions で「サイト側の submodule ポインタを進めて push」
      するのが最小構成。Vercel Deploy Hook を叩くだけではポインタが古いままなので不十分

**完了条件**: 記事リポジトリへの push だけで記事が公開される

---

## Phase 7 — Keystatic（ブラウザ編集）

要件③の本体。Phase 0 で実現可能性を確認済みである前提。

- [ ] **`@astrojs/vercel` アダプタを導入し、Keystatic の API ルートをサーバ側で動かす**
      （Phase 0 の追加前提1。静的出力のみでは GitHub モードが成立しない）
- [ ] Keystatic を導入
- [ ] `keystatic.config.ts` の `storage` を content リポジトリ（`repo: { owner, name }`）に向ける
- [ ] `keystatic.config.ts` でスキーマを Phase 2 の frontmatter と一致させる
- [ ] ローカルモード（`storage: { kind: 'local' }`）で編集できることを確認
- [ ] GitHub モードに切り替え（★確認 / GitHub App のインストールが要る）
      → GitHub App は **content リポジトリ**に対して write 権限でインストールする
      → 環境変数 4つを Vercel 側にも設定する
- [ ] **画像のドラッグ&ドロップが動き、リポジトリにファイルが入ることを確認**
- [ ] スマホのブラウザから編集できることを確認

**完了条件**: ブラウザから記事を書き、画像を貼り、公開できる

---

## Phase 8 — 移行の締め（★外部アクション）

- ~~既存 microCMS 記事の移行~~ → **不要**（Phase 0 で「移行しない」と決定）
- ~~独自ドメインの切り替え / 旧 URL からのリダイレクト~~ → **不要**（Phase 0 で「引き継がない」と決定）
- [ ] 旧 Gatsby / microCMS の停止（★確認）
- [ ] **`ws/blog`（下書き）→ `ws/blog-content`（公開）の受け渡し導線を決める**
      Phase 0 で `ws/blog` を下書き置き場のまま残すと決めたため、ここが手作業のまま残っている。
      案: `today` スキルの出力先自体を `ws/blog-content` に変える / 公開用のコピースクリプトを作る
- [ ] `today` スキルを、最初から frontmatter 付き md を吐くよう更新
      → `import-posts.mjs` による正規化が不要になる

**完了条件**: 新ブログが正式運用に入り、旧環境を止められる

---

## 現在地

**Phase 1 完了（2026-08-31）。次は Phase 2（既存記事の取り込み）＝ 今回の山場。**

Git は Phase 5 の予定だったが、Phase 1 が一区切りなので前倒しで `git init` + 初回コミットまで実施済み
（`main` / `b3f92af`）。GitHub へのリポジトリ作成・push はまだ（Phase 5 で確認を取ってから）。

決定サマリ:
| 論点 | 決定 |
|---|---|
| プロジェクトディレクトリ | `ws/my-blog-2` |
| content リポジトリ | `ws/blog-content` を新設。`ws/blog` は下書き置き場のまま残す |
| microCMS 記事の移行 | しない |
| 独自ドメイン | 引き継がない。Vercel 発行の URL を使う |
| Keystatic の別リポジトリ参照 | 可能（要 Vercel アダプタ / submodule ポインタ更新の導線） |
