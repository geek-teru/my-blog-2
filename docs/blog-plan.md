# 個人ブログ再構築 — 実装計画

要件・仕様は同じディレクトリの `blog-spec.md` を参照。こちらは**進め方**のみを扱う。
デザインの決めごとは `style-guide.html` にある。

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
5. **作業中に出てきた積み残しは、その場で「積み残し TODO」に書く。** フェーズの
   チェックリストは着手前に決めた計画、TODO は**やってみて初めて出てきたもの**。
   混ぜると計画と現実の区別がつかなくなるので分けておく
6. **フェーズに属さない作業は「寄り道の記録」に書く。** 見た目の作り直しのように、
   当初の計画には無かったがまとまった規模になったものは、フェーズ番号を増やさず
   別枠で記録する。フェーズは移行の筋道、寄り道はその横で起きたこと

### なぜこの順番か
デプロイ（Phase 5）を先に置いたのは、まず単一リポジトリで確実に本番を通してから
記事リポジトリの分離に進むためだった。**その分離（旧 Phase 6）は 2026-09-01 に取りやめた**
（理由は下記「Phase 6 — 取りやめ」）。結果として、Phase 5 の次は Keystatic になる。

---

## 積み残し TODO

フェーズを進める中で出てきたタスク。フェーズのチェックリストとは別枠で、
**着手前には見えていなかったもの**だけをここに積む。
片付いたらチェックを入れ、どこで対応したかを1行残す。

### 公開前に必ず潰す

- [ ] **記事本文に下書きメモが残っている**
      `content/blog/nextjs-middleware-route-protection.md` の「はじめに」直下に
      `> ここは下書きです。動機まわりはご自身の言葉に差し替えてください。` がある。
      → **2026-08-31: 記事を `draft: true` にして本番ビルドから隠した。**
      漏れる心配は消えたが、メモ自体は残っている。動機の段落を自分の言葉で書き、
      メモを消し、`draft: false` に戻すところまでが完了。これは体裁ではなく執筆作業。
      **あわせて、Phase 4 の検証で入れたサンプル画像（`heroImage` と本文中の1枚）が
      同じ記事に残っている。** 実物のスクショに差し替えるか、外すこと。
      → 出どころ: Phase 2 / Phase 4
- [x] ~~**`/blog/nextjs-supabase-google-oauth-local/` へのリンクが 404 になる**~~
      → **2026-08-31 対応済み。** `2026-08-30-nextjs-supabase-google-oauth-local.md` を
      追加で取り込み、リンク先を実在させた（案 (a)）。dev で 200 を確認。→ 出どころ: Phase 2
- [x] ~~**Header / Footer のソーシャルリンクが Astro 公式アカウントのまま**~~
      → **2026-08-31 対応済み。** Mastodon / Twitter / GitHub の3つとも、markup と CSS ごと削除。
      本人のアカウントを載せたくなったら足す。→ 出どころ: Phase 1（雛形の初期値）

### Phase 3（体裁）で扱う

- [x] ~~**日付の表示が英語のまま**~~
      → **2026-08-31 対応済み。** locale を `ja-JP` / `month: 'long'` にして `2026年8月31日` に。
      あわせて `Last updated on` を「最終更新:」に。→ 出どころ: Phase 2
- [x] ~~**和文 Web フォントを入れるか再検討する**~~
      → **2026-08-31 判断: 入れない。現状の OS 同梱フォントのままとする。**
      CJK の Web フォントは配信量が桁違いに大きく、読みやすさの改善に見合わない。
      意匠を作り込む段になったら蒸し返す。→ 出どころ: Phase 1

### 後続フェーズ待ち・判断待ち

- [ ] **`scripts/import-posts.mjs` の未検証分岐が3つある**
      1本しか通していないため、以下は一度も動いていない。
      残り3本を取り込むことになったら、そこが初回実行になる。
      - 日付フォールバック（ファイル名に `YYYY-MM-DD-` が無いとき mtime を使う）
      - タイトルが H1 でない場合のフォールバック（最初の非空行を使う）
      - frontmatter 済みファイルの素通し
      ※ 2026-08-31: 2本目の取り込み時に `extractTitle` がコードフェンスを見ておらず、
        TOML / シェルのコメント行（`# ...`）を見出しと誤認する不具合が見つかり修正した。
        タイトルが H1 でない残り2本はこの罠を踏みやすいので、取り込み時は結果を目視すること。
      → 出どころ: Phase 2
- [ ] **OGP 画像が Astro のプレースホルダ画像のまま**
      `src/assets/blog-placeholder-1.jpg` が全ページの `og:image` の既定値になっている。
      SNS に貼ると Astro のサンプル画像が出る。記事ごとの `heroImage` か、
      サイト共通の OGP 画像を用意するか。→ 出どころ: Phase 3
- [ ] **ファビコンが Astro の既定のまま**
      ブラウザのタブに Astro のロゴが出る。→ 出どころ: 寄り道（デザイン）
- [ ] **トップの説明文を2箇所で持っている**
      `consts.ts` の `SITE_DESCRIPTION`（メタタグ用）と `TerminalIntro.astro` の本文。
      似た文面を別々に持っているので、片方だけ直すとずれる。→ 出どころ: 寄り道（デザイン）
- [ ] **グローバルな `box-sizing: border-box` が無い**
      枠線を持つ要素ごとに個別指定している。入れるべきだが、既に組んだカード・
      検索窓・目次の寸法が一斉に変わるため、各所を再確認する前提の別作業にする。
      → 出どころ: 寄り道（デザイン）
- [ ] **`/about` の URL が消えたがリダイレクトを置いていない**
      `/profile` に統合した。開設直後で外部リンクが無いため実害は無いと判断した。
      → 出どころ: 寄り道（デザイン）
- [ ] **Profile / Career の文章が仮のまま**
      Profile は暫定の文面、Career は経歴データのみで人物紹介が無い。
      → 出どころ: 寄り道（デザイン）
- [ ] **タグが表示だけで、リンクになっていない**
      タグ別の一覧ページ（`/tags/<tag>/`）を作るかは未判断。
      作らないなら、タグはあくまで記事の属性表示にとどまる。→ 出どころ: Phase 3
- [ ] **型チェックが機械で回っていない**
      `astro build` は型を見ないため、`astro check`（要 `@astrojs/check` + `typescript`）が無いと
      Props の不整合が本番まで残る。実際 Phase 3 で `BaseHead` の `description` が
      必須のままになっていたのを目視で見つけた。依存を1つ増やす判断が要る。
      → 出どころ: Phase 3
- [ ] **git の `user.email` がグローバル設定ではプレースホルダのまま**
      `you@example.com`。このリポジトリだけローカル設定で修正済みだが、
      他プロジェクトも同じ状態の可能性が高い。
      `git config --global user.email "nan1102.business@gmail.com"` で直せる。
      → 出どころ: Phase 1 後の初回コミット時

---

## Phase 0 — 決める（実装なし） ✅ 完了（2026-08-31）

着手前に潰しておく判断。ここが決まらないと後で手戻りする。

- [x] **プロジェクトディレクトリ名を決める** → `ws/my-blog-2`
- [x] ~~**`ws/blog` を content リポジトリ本体にするか** → しない。`ws/blog-content` を新設する~~
      → **2026-09-01 撤回。** リポジトリの分離自体をやめたため、`ws/blog-content` は作らない
        （Phase 6 参照）。`ws/blog` を下書き置き場のまま残す点は変わらず、
        `ws/blog` → `content/blog` の受け渡し工程は Phase 8 の課題として残る
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
2. ~~**Keystatic のコミット先と submodule のポインタがズレる。**
   Keystatic は content リポジトリへ直接コミットするが、submodule はコミットを固定するため、
   content 側への push だけではサイト側のビルドは新しい記事を拾わない。~~
   → **2026-09-01: この制約が決め手となって、リポジトリの分離自体を取りやめた。**
     分離しなければ Keystatic のコミット先と Vercel の監視先が同じになり、
     中継の仕組みが要らなくなる（Phase 6 参照）

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
- Header / Footer のソーシャルリンクは Astro 公式アカウントのまま → 「積み残し TODO」へ

## Phase 2 — 既存記事の取り込み ✅ 完了（2026-08-31）

**取り込み対象はユーザー指示により `2026-08-31-nextjs-middleware-route-protection.md` の1本のみ。**
残り3本（`2026-08-30-nextjs-supabase-google-oauth-local` / `claude-code-with-playwright-mcp` /
`jamstack-blog`）は取り込んでいない。

- [x] `content/blog/` をプロジェクトルート直下に作成
- [x] `src/content.config.ts` の glob `base` を `./content/blog` に変更
- [x] **`base` が `src/` の外でも解決できるか確認** → **できる。dev / build の両方で確認済み**
      （未検証事項がひとつ潰れた。blog-spec.md 8節も更新済み）
- [x] スキーマを更新: `draft` (default false) と `tags` (default []) を追加、`description` を任意に
- [x] `scripts/import-posts.mjs` を作成（仕様は spec 5節どおり。ファイル指定の引数を追加）
- [x] 取り込みを実行 → `content/blog/nextjs-middleware-route-protection.md`
- [x] ブラウザで確認
      - [x] タイトルが二重に出ていない（`main h1` は1つだけ）
      - [x] 記事間リンクが `/blog/<slug>/` に張り替わっている
      - [x] コードブロック 10 個すべて Shiki のハイライトが効いている（`astro-code github-dark`）
      - [x] 表 2 個が崩れず、横スクロールも発生していない
      - [x] `npx astro build` が通る（4ページ生成）

**完了条件**: 既存記事が一覧に並び、開けて内容が崩れていない → **達成**

### Phase 2 で出た積み残し

いずれも「積み残し TODO」に移した。ここでは出どころだけ記録しておく。

- 記事本文に下書きメモが残っている（公開前に潰す）
- 張り替えたリンクの飛び先が存在せず 404 になる（公開前に潰す）
- 日付の表示が英語のまま（Phase 3 で扱う）
- `import-posts.mjs` の3分岐が未検証（残り3本を取り込むときが初回実行）

## Phase 3 — ブログとしての体裁 ✅ 完了（2026-08-31）

- [x] **draft フィルタを実装**（`import.meta.env.PROD` で除外）
      - [x] 一覧ページ / 記事ページの `getStaticPaths` / RSS の3箇所すべて
      - [x] `src/lib/posts.ts` の `getPublishedPosts()` に集約。
            `src/pages/` `src/layouts/` から `getCollection` の直呼びは無い
- [x] `draft: true` の記事を作って、dev で見えて build で消えることを確認
      → dev の一覧に2本、記事ページも 200。`astro build` 後は `dist/` に HTML が無く、
        `rss.xml` にも `sitemap-0.xml` にも載らない
- [x] タグの表示（一覧・記事）→ `src/components/Tags.astro`
- [x] 目次（TOC）→ **入れる判断で実装。** `src/components/TableOfContents.astro`
      h2 / h3 を拾い、2項目以上あるときだけ出す。18項目でアンカーの解決を確認
- [x] コードブロックのシンタックスハイライト確認（Phase 2 で確認済み）
- [x] OGP / メタタグ / `<title>`
      → `<title>` に `| サイト名` を付与（トップは二重にしない）。
        記事ページの `og:type` を `article` に。`BaseHead` の `description` を任意化
- [x] RSS・sitemap・404 の動作確認
      → 404 ページが雛形に無かったので `src/pages/404.astro` を新規作成
- [x] **`npm run build` が通ることを確認**（5ページ）

**完了条件**: 本番ビルドが成功し、`npm run preview` で一通り閲覧できる → **達成**

### Phase 3 で見つけて直した不具合

- **`BaseHead` の `description` が必須のままだった。** Phase 2 でスキーマ上は任意にしたのに
  Props 側が追随しておらず、型と実態がずれていた。既定値を `SITE_DESCRIPTION` にして解消
- **`/about` のビルドが `Tags` で落ちた。** about ページはコレクション経由ではなく
  `BlogPost` レイアウトを直接使うため `tags` が undefined になる。
  受け取る側（`Tags` / `BlogPost`）で既定値 `[]` を持たせて解消。
  `headings` も同じ理由で任意にしてある
- **タグの寄せが一覧の見出しと揃わなかった。** 雛形は先頭の1件だけ中央寄せなので、
  flex の `justify-content` で中央固定にすると必ずどこかで崩れる。
  `li` を `inline-block` にして親の `text-align` に追従させた

## Phase 4 — 画像 ✅ 完了（2026-08-31）

手元に貼りたいスクショが無かったため、**雛形付属の実写 JPEG を検証用画像として使った**。
合成した単色画像だと最適化の効き具合が分からないので、写真である必要があった。

- [x] `content/blog/images/` に画像を1枚置く → `sample-screenshot.jpg`（32kB）
- [x] 記事から相対パスで参照 → `![...](./images/sample-screenshot.jpg)`
- [x] **相対パス画像に Astro の画像最適化が効くか確認** → **効く**（未検証事項が潰れた）
      - dev: `/_image?...&f=webp` を経由し、`image/webp` が 200 で返る
      - build: jpg から webp へ変換され、サイズ違いで3枚生成された
        （hero 1020x510 は 32kB → 16kB）。HTML の参照も `/_astro/*.webp` になっている
- [x] `heroImage` の動作確認 → frontmatter の `./images/...` が解決し、記事上部に表示される
- [x] ビルド後の出力サイズを見て、容量方針を再確認 → **同梱のまま続行でよい**

**完了条件**: 記事に画像が表示され、ビルドが通る → **達成**

### 容量方針の再確認

| 対象 | サイズ |
|---|---|
| `dist` 全体（記事2本 + 画像3変換） | 330 KB |
| `dist/_astro`（画像・アセット） | 184 KB |
| `content/blog`（元データ） | 72 KB |

スクショを 1 枚 300 KB、1記事あたり5枚と見積もっても 1.5 MB/記事。
GitHub の 1 リポジトリ 1GB 推奨に対して 600 記事ぶん入る計算で、当面まったく問題にならない。
**Cloudflare R2 への退避は不要**。逼迫の兆しが出てから考える。

### 検証の手順についてのメモ

画像を入れた Middleware の記事は `draft: true` のため本番ビルドに出てこない。
build での最適化を確認するために **一時的に `draft: false` にしてビルドし、確認後に戻した**。
現在は `draft: true` に戻っている。

## Phase 5 — デプロイ（★外部アクション） ✅ 完了（2026-08-31）

**このフェーズから実行前に確認を取ること。**

- [x] `git init` + 初回コミット → **Phase 1 完了時点に前倒しで実施**（2026-08-31 / `main` / `b3f92af`）
      ※ `user.email` が `you@example.com` のままだったため、このリポジトリだけローカル設定で修正
- [x] GitHub リポジトリを作成（★確認済みで実行 / 2026-08-31）
      → https://github.com/geek-teru/my-blog-2 **public** / default branch `main`
      → 既存の `geek-teru/my-blog`（Gatsby / `master`）には触れていないことを確認済み
      → 公開前スキャンの結果: `.env` 等の混入なし、APIキーの実値なし。
        `blog-spec.md` の microCMS serviceId と、コミットのメールアドレスは
        **公開されることを承知のうえで**そのままにする判断（2026-08-31）
- [x] Vercel プロジェクトを作成し連携（★確認済みで実行 / 2026-08-31）
- [x] 本番ビルドが Vercel 上で通る → GitHub Deployment が `state: success`
      → 本番 URL: **https://my-blog-2-terus-projects-8b7c1ca7.vercel.app**
      → 本番で draft 記事が 404 になることも確認（draft フィルタが実環境で効いている）
- [x] ブランチを切って PR を作り、**Preview Deployment の URL が発行されることを確認**（要件①）
      → PR #1 で確認。`state: success` でプレビュー URL が発行され、そこで
        `site` 修正の効果（RSS・sitemap のリンク）まで見えた
- [x] `astro.config.mjs` の `site` を実際の URL に更新

**完了条件**: 本番 URL で閲覧でき、PR ごとにプレビュー URL が出る → **達成**

### Phase 5 で踏んだ罠

1. **`my-blog-2.vercel.app` は別のユーザーに取られていた。**
   Phase 1 で仮 URL としてこの値を `site` に入れていたため、本番の RSS のリンクが
   まるごと無関係のサイトを指していた（デプロイ後に実物を開いて発覚）。
   Vercel がこのプロジェクトに割り当てたのはチーム名込みの
   `my-blog-2-terus-projects-8b7c1ca7.vercel.app` のほう。
   **仮の URL は「後で直す」ではなく「実物を開いて確かめる」までがセット。**
2. **Vercel の Deployment Protection が既定で有効だった。**
   本番 URL がログイン画面にリダイレクトされ、誰も記事を読めない状態だった。
   `curl` は 200 を返すため（ログインページの 200）、ステータスコードだけ見ていると
   気づけない。Settings → Deployment Protection → Vercel Authentication を Disabled にして解消

---

## 寄り道の記録 — 見た目とサイトの性格（2026-09-01）

Phase 5 と Phase 6 の間で、フェーズには無い作業をまとめて行った。
規模が大きいので別枠で残す。決めごとの詳細は `style-guide.html` にある。

### きっかけ

雛形（Astro の blog テンプレート / Bear Blog ベース）の数値がすべて欧文向けで、
日本語の記事を載せると窮屈だった。あわせて、扱う内容がブログ単体から
**キャリアとスキルにも広がった**ため、サイトの性格そのものを見直した。

### やったこと

| 領域 | 内容 |
|---|---|
| タイポグラフィ | 和文基準に引き直し（本文 20px→17px / 行間 1.7→1.9 / h1 61px→31px） |
| サイト名 | `Teru's Blog` → **`Teru's Home`** |
| ナビゲーション | Home / Profile / Career / Blog。`/about` は `/profile` に統合 |
| ヘッダー | ネイビーの2段構成。1段目にサイト名と検索窓、2段目にメニュー |
| パンくず | 追加。URL から機械的に組み立てる |
| 記事一覧 | カードのグリッド（3列）。一覧ページだけ列幅を 44rem→64rem に拡張 |
| 目次 | 記事ページの左サイドナビ化 + スクロール連動の現在地表示（水色） |
| 検索 | `/search` を新設。ビルド時に `search-index.json` を書き出しブラウザ側で絞り込む |
| トップの演出 | ターミナル風タイピング + 記事をコミットに見立てたグラフ |
| Career ページ | 経歴を git のコミットグラフとして描画 |
| スタイルガイド | `style-guide.html` を新設 |

### Career ページのデータの持ち方

`ws/my-blog/gatsby-microcms/src/career/index.md` の内容を移植した。
**`content/career/` に1ファイル1ノードの Markdown** として置き、コンテンツ
コレクションで読んでビルド時に展開する。

- 構造（ブランチ / 期間 / 概要）は frontmatter、業務詳細は本文
- 見出しから構造を読み取る作りにすると、書き方が少し揺れただけでグラフが崩れる
- ブランチの並び順と「どれが現在進行中か」は日付から導く。`current: true` の
  ような印を置くと、新しい案件を足したときに消し忘れて現在地が2つできる

### 判断として残しておくこと

- **和文 Web フォントは使わない。** CJK はサブセットが桁違いに大きく、
  `subsets` に `japanese` を明示しないとかえって表示できない
- **動きは意味のあるものだけ。** `prefers-reduced-motion` を尊重し、
  外部のアニメーションライブラリは足さない
- **作り話の情報を足さない。** コミットグラフにハッシュ風の文字列を並べれば
  それらしくなるが、実在しない値を本物に見える形で出すことになる
- **コミットグラフの見た目は `global.css` の `.commit-graph` に集約。**
  トップと Career で共有し、色だけ変数で差し替える

### この寄り道で踏んだ、繰り返しやすい罠

1. **dev サーバーがスコープ付き CSS を取りこぼす。** markup は新しいのに
   スタイルが古いままになる。**このセッションで3回起きた**。
   スタイルを変えて反映されないときは、まず dev サーバーの再起動を疑う
2. **JS が `innerHTML` で作った要素に Astro のスコープ付き CSS は当たらない。**
   スコープ用の属性が付かないため。`:global()` で抜ける（検索結果と業務詳細で2回）
3. **`box-sizing` の既定は `content-box`。** 枠線を持つ丸の中心計算が 2px ずれる
4. **子孫セレクタが入れ子のリストにも当たる。** `.commits li` が箇条書きの
   `li` まで grid にして本文が潰れた。直接の子（`>`）に絞る
5. **間隔を `padding` で取るか `margin` で取るかが、線の長さを決める。**
   線は要素の内側に引かれるので、内側に余白を置くと線も伸びる

---

## Phase 6 — 記事リポジトリの分離 ❌ 取りやめ（2026-09-01）

要件④の本体として計画していたが、**着手前に取りやめた**。Phase 0 の
「`ws/blog-content` を新設する」という決定も撤回する。

### 取りやめた理由

**分離すると、ブラウザ編集のプレビューが成立しない。**

Vercel が見ているのはサイト側のリポジトリなので、Keystatic が content リポジトリへ
コミットしても何も起きない。submodule は参照するコミットを固定する仕組みで、
content 側が進んでもサイト側のポインタは古いままだからだ。プレビューを出すには
「content 側の Actions がサイト側の submodule ポインタを進めて push する」中継が要る。

これは Phase 0 の調査で「追加の前提2」として挙げていた問題そのもので、
**分離しなければ経路ごと消える。**

一方、要件④の目的（記事をブログシステムに縛られない形で持つ）は分離しなくても
達成できている。`content/blog/*.md` は素の Markdown で、ディレクトリごとコピーすれば
他へ移せる。履歴を分けて追いたいだけなら `git log content/` で足りる。

後から切り出すのも難しくない。別リポジトリにして submodule にするだけで、
記事ファイル自体は1文字も変わらない。**いま分けない判断は後戻りできる。**

### この判断で消えたもの

- `ws/blog-content` リポジトリの新設
- submodule 化と、Vercel での submodule ビルド検証（未検証事項がひとつ消えた）
- content から サイトへ再ビルドを中継する GitHub Actions

### 記事の置き場（変更なし）

`content/blog/` のまま。`src/` の外に置く配置は維持する。
記事とサイトのコードを混ぜない意味で有効で、切り出したくなったときに
そのまま submodule 化できる余地も残るため。

---

## Phase 7 — Keystatic（ブラウザ編集）

要件③の本体。Phase 0 で実現可能性を確認済みである前提。

- [ ] `@keystatic/core` `@keystatic/astro` を導入（`npx astro add react markdoc` も要る）
- [ ] **`@astrojs/vercel` アダプタを導入する**
      Keystatic は GitHub 認証のコールバックとトークン交換をサーバ側で行う。
      ブラウザに出せないシークレットを扱うため、静的出力だけでは成立しない。
      記事ページは静的のまま、`/keystatic` まわりだけサーバで動く hybrid 構成になる
- [ ] `keystatic.config.ts` でスキーマを Phase 2 の frontmatter と一致させる
      （`title` / `description` / `pubDate` / `tags` / `draft` / `heroImage`）
      ※ ずれるとブラウザで保存した瞬間に Astro 側のスキーマ検証で落ちる
- [ ] **`storage` を環境で切り替える**
      ```ts
      storage: import.meta.env.DEV
        ? { kind: 'local' }   // ローカルのファイルを直接書き換える。コミットなし
        : { kind: 'github', repo: { owner: 'geek-teru', name: 'my-blog-2' } }
      ```
      手元で `astro dev` を動かしている間は、管理画面を使ってもコミットが発生しない。
      反復して書き直すのはこちらで行う（下記「執筆とプレビューの運用」）
- [ ] ローカルモードで編集できることを確認
- [ ] GitHub モードに切り替え（★確認 / GitHub App のインストールが要る）
      → GitHub App は **サイトと同じリポジトリ**（`geek-teru/my-blog-2`）に write 権限で入れる
      → 環境変数 4つを Vercel 側にも設定する
        （`KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` /
        `KEYSTATIC_SECRET` / `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`）
- [ ] `branchPrefix` を設定し、管理画面から作れるブランチを絞る
- [ ] **画像のドラッグ&ドロップが動き、リポジトリにファイルが入ることを確認**
- [ ] スマホのブラウザから編集できることを確認

**完了条件**: ブラウザから記事を書き、画像を貼り、公開できる

### 執筆とプレビューの運用（2026-09-01 決定）

Keystatic は git をデータベースとして使うので、**GitHub モードでは保存＝コミット**。
反復して書き直すとコミットが積み上がる。そこで**ループごとに使う層を変える**。

| ループ | 使う層 | コミット |
|---|---|---|
| 文章を書き直しては見る（**反復はここ**） | `astro dev` + Keystatic ローカルモード | **0回** |
| 本番ビルドで崩れないか確認 | PR の Preview Deployment | 1回 |
| 書けたが公開はまだ | `draft: true` | — |

1. **書くのはローカル。** `astro dev` を立てて、エディタか Keystatic のローカルモードで反復
2. 仕上がったらブランチを切ってコミット → PR → プレビューで本番ビルドを確認
3. マージして公開。まだ出したくなければ `draft: true` のままマージ
4. 手元に PC が無いときだけ GitHub モード。ブランチで保存を重ね、**squash merge** で
   `main` には1コミットだけ入れる。散らかるのはブランチの中だけに留める

**リモートで見るには必ずコミットが要る**（git がデータベースなので避けられない）。
だから反復をリモートに置かない。プレビュー3層はこの使い分けのために用意したもの。

なお push のたびに Vercel がビルドするため、反復をリモートでやると
**ビルド回数の面でも不利**。Hobby プランには1日あたりのデプロイ数の上限がある。

---

## Phase 8 — 移行の締め（★外部アクション）

- ~~既存 microCMS 記事の移行~~ → **不要**（Phase 0 で「移行しない」と決定）
- ~~独自ドメインの切り替え / 旧 URL からのリダイレクト~~ → **不要**（Phase 0 で「引き継がない」と決定）
- [ ] 旧 Gatsby / microCMS の停止（★確認）
- [ ] **`ws/blog`（下書き）→ `content/blog`（公開）の受け渡し導線を決める**
      `ws/blog` を下書き置き場のまま残しているため、ここが手作業で残っている。
      案: `today` スキルの出力先を `content/blog` に変える / 公開用のコピースクリプトを作る
      ※ 分離を取りやめたので、移す先は別リポジトリではなくこのリポジトリの `content/blog`
- [ ] `today` スキルを、最初から frontmatter 付き md を吐くよう更新
      → `import-posts.mjs` による正規化が不要になる

**完了条件**: 新ブログが正式運用に入り、旧環境を止められる

---

## 現在地

**Phase 5 まで完了。Phase 6 は取りやめ。次は Phase 7（Keystatic / ★外部アクション）。**

Phase 5 と Phase 6 の間に、見た目の作り直しという寄り道が入っている（上記「寄り道の記録」）。
本番は稼働中で、記事1本が公開され、Career ページが載っている状態。

決定サマリ:
| 論点 | 決定 |
|---|---|
| プロジェクトディレクトリ | `ws/my-blog-2` |
| サイト名 | `Teru's Home` |
| 本番 URL | https://my-blog-2-terus-projects-8b7c1ca7.vercel.app |
| GitHub | https://github.com/geek-teru/my-blog-2 （public / `main`） |
| 記事リポジトリの分離 | **しない**（2026-09-01 に要件④を撤回）。`content/blog/` のまま |
| 執筆の反復 | ローカル（`astro dev` + Keystatic ローカルモード）。コミットは仕上がってから |
| microCMS 記事の移行 | しない |
| 独自ドメイン | 引き継がない |
| Keystatic の保存先 | サイトと同じリポジトリ。手元では `storage: local` でコミットを出さない |

`gh` は WSL(Ubuntu) に 2.98.0 が入っており `geek-teru` で認証済み
（scopes: repo, workflow, gist, read:org）。
**Git Bash からは見えないので `wsl -e bash -lc "..."` 経由で叩くこと。**

**再開するときは、フェーズの続きに入る前に「積み残し TODO」を見ること。**
「公開前に必ず潰す」に Middleware 記事の下書きメモが1件残っている。
