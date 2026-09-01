# 個人ブログ再構築 — 要件・仕様

別セッションで実装するための引き継ぎドキュメント。
このファイルを読んでから着手すること。

- 作成日: 2026-08-31
- 実装場所: `ws/my-blog-2`（既存の `ws/my-blog` とは別）
- このファイルの置き場: `docs/blog-spec.md`
- 実装計画: 同じディレクトリの `blog-plan.md`

---

## 1. 背景と、何が問題だったのか

### 既存環境
`C:\Users\nanch\ws\my-blog`（リポジトリ: `https://github.com/geek-teru/my-blog`）

| 項目 | 内容 |
|---|---|
| フレームワーク | Gatsby v5.14（実体は `gatsby-microcms/` 配下） |
| コンテンツ | microCMS（serviceId: `vl03t31fxb` / endpoint: `blogs`） |
| 配信 | Vercel |
| 本文描画 | `src/templates/blog-post.js` で `dangerouslySetInnerHTML` |

### 中心的な課題
**AI が生成した md を microCMS に貼ると、マークダウン記法が生テキストのまま表示される。**

原因ははっきりしている。microCMS のリッチエディタは **HTML を保存するフィールド**で、
そこに `## 見出し` と打つと `<p>## 見出し</p>` として保存される。
Gatsby はそれをそのまま HTML として出力するため、md はどの工程でも解釈されていない。

`ws/blog/2026-08-31-nextjs-middleware-route-protection.html` が存在するのは、
手で HTML 化して回避した形跡。この手作業をなくすことが今回のゴール。

### 付随する判断
Gatsby は Netlify 買収後、実質メンテナンスモード。v5 以降の目立った進展がなく、
新規に積み増す理由が乏しいため、載せ替える。

---

## 2. 要件

ユーザーが明示した必須要件:

1. **プレビューが見れる**
2. **ストレージ容量が大きい**
3. **画像を貼れる**
4. ~~**記事ファイルはブログシステムとは別で管理したい**~~
   → **2026-09-01 撤回。** 分離しない判断に変更（理由は3節）

ヒアリングで確定した前提:

- **執筆環境**: ローカルエディタ（VS Code / Obsidian）と**ブラウザ編集の両方**を使いたい
- **画像規模**: 記事あたりスクショ数枚程度

---

## 3. 決定した構成

```
Astro（最新の 7.x）+ Content Layer API
  記事      : サイトと同じリポジトリの content/blog/*.md（素の Markdown）
  画像      : content/blog/images/ に同梱（増えたら Cloudflare R2 へ逃がせる形にしておく）
  編集      : ローカルエディタ + Keystatic（ブラウザ）の両刀
  配信      : Vercel（既存アカウント・設定を流用）
  プレビュー : astro dev / Vercel Preview Deployment / frontmatter の draft: true
```

### 要件との対応

| 要件 | 対応 | 補足 |
|---|---|---|
| ① プレビュー | `astro dev` で即時反映 / PR ごとに Preview Deployment の URL / `draft: true` で本番ビルドから除外 | 3層。現状の microCMS プレビューより手厚い |
| ② ストレージ | 当面は content リポジトリに同梱（GitHub は 1リポジトリ 1GB 推奨・1ファイル 100MB 上限） | スクショ数枚/記事なら十分。逼迫したら Cloudflare R2（無料枠 10GB・**egress 課金なし**）へ移す |
| ③ 画像を貼れる | Keystatic の管理画面でドラッグ&ドロップ。保存先はリポジトリの実ファイル | ローカルでは VS Code の画像ペースト拡張 / Obsidian |
| ④ 記事を別管理 | ~~独立した Git リポジトリにする~~ → **撤回**。同一リポジトリの `content/blog/` に素の Markdown で置く | 下記「④ を撤回した理由」 |

### CMS を捨てる理由
ヘッドレス CMS が効くのは「スマホから書く」「非エンジニアが書く」場合。
**AI が md を吐く → git に置く**というこのフローでは、
CMS は「md を HTML に変換して貼る」という余計な工程を挟むだけの摩擦になる。

Keystatic は CMS のような編集 UI を提供しつつ、**保存先がリポジトリの md ファイル**なので、
要件③（画像を貼れる）を満たしながら、記事を素の Markdown のまま保てる。ここが構成の要。

### ④ を撤回した理由（2026-09-01）

**リポジトリを分けると、ブラウザ編集のプレビューが成立しなくなる。**

Vercel が見ているのはサイト側のリポジトリなので、Keystatic が content リポジトリへ
コミットしても何も起きない。submodule は参照するコミットを固定する仕組みで、
content 側が進んでもサイト側のポインタは古いままだからだ。
プレビューを出すには、content 側から サイト側の submodule ポインタを進める
中継の GitHub Actions が要る。**分離しなければ、この経路ごと不要になる。**

一方、④ の目的（記事をブログシステムに縛られない形で持つ）は、分離しなくても
達成できている。`content/blog/*.md` は素の Markdown で、フレームワークに依存する
記述を含まない。**ディレクトリごとコピーすれば他へ移せる。**
履歴を分けて追いたいだけなら `git log content/` で足りる。

後から切り出すことも難しくない。`content/blog` を別リポジトリにして submodule に
するだけで、記事ファイル自体は1文字も変わらない。**「後で分けられる」ので、
いま分けない判断は安全側**という整理。

分離が必要になるのは、記事だけ別の権限で他人に触らせたくなったときぐらい。

---

## 4. ディレクトリ構成

```
my-blog-2（単一リポジトリ）
├── content/
│   ├── blog/          ← 記事。素の Markdown + images/
│   └── career/        ← 経歴。1ファイル1ノード
├── src/
│   ├── pages/
│   ├── layouts/
│   └── content.config.ts
├── docs/              ← blog-plan.md / blog-spec.md / style-guide.html
├── scripts/import-posts.mjs
├── keystatic.config.ts
└── astro.config.mjs
```

`content/` を `src/` の外、プロジェクトルート直下に置いている。
当初は別リポジトリのマウント先にするためだったが、分離をやめた今も
**記事とサイトのコードを混ぜない**意味で有効なので、この配置は維持する。
切り出したくなったときにそのまま submodule 化できる余地も残る。

---

## 5. 既存記事の性質（重要 — ここを踏まないと必ず詰まる）

移行元は `C:\Users\nanch\ws\blog\`。**`ws/blog` は Git リポジトリではない**（要 `git init`）。

| ファイル | タイトルの在り方 | 日付 |
|---|---|---|
| `2026-08-30-nextjs-supabase-google-oauth-local.md` | 先頭が `# ...` の H1 | ファイル名にあり |
| `2026-08-31-nextjs-middleware-route-protection.md` | 先頭が `# ...` の H1 | ファイル名にあり |
| `2026-08-31-nextjs-middleware-route-protection.html` | （手動 HTML 化の産物。取り込み対象外） | — |
| `claude-code-with-playwright-mcp.md` | **H1 ですらない素のテキスト行** | **なし** |
| `jamstack-blog.md` | **H1 ですらない素のテキスト行** | **なし** |

**すべてのファイルに frontmatter が無い。**

つまり:
- タイトルは「最初の H1、無ければ最初の非空行」から拾う必要がある
- 日付はファイル名の `YYYY-MM-DD-` プレフィックスから。無ければファイルの mtime にフォールバック
- タイトル行は本文から取り除く（レイアウト側で `<h1>` を出すため、残すと重複する）
- 記事間リンクが**相対 md パス**になっている
  （例: `[前回の記事](./2026-08-30-nextjs-supabase-google-oauth-local.md)`）
  → `/blog/<slug>/` に張り替えが必要
- スラッグはファイル名から日付プレフィックスを落としたものにすると URL が短くて済む

### 設計判断: カスタムローダーではなく「実ファイルに frontmatter を書く」
frontmatter が無いまま Astro のカスタムローダーで吸収する案もあるが、**採用しない**。

理由は **Keystatic が frontmatter のフィールドを前提に編集 UI を組み立てる**ため。
ローダー側でごまかすとブラウザ編集が機能しない。
`scripts/import-posts.mjs` のような正規化スクリプトで実ファイルに frontmatter を書き込み、
その後は Astro 標準の `glob()` ローダーだけで完結させる。

スクリプトの要件:
- 既存ファイルは**上書きしない**（手で直した内容を壊さないため）。`--force` のときだけ上書き
- すでに frontmatter があるファイルは素通しする（冪等）
- `.md` のみ対象。`.html` は無視

---

## 6. frontmatter スキーマ

```yaml
---
title: "記事タイトル"          # 必須。H1 or 先頭行から自動生成
description: "説明"            # 任意。最初の段落/箇条書きから 100 字程度を自動生成
pubDate: 2026-08-30            # 必須。ファイル名 or mtime から
updatedDate: 2026-08-31        # 任意
tags: []                       # 任意
draft: false                   # 必須(default false)。true なら本番ビルドから除外
heroImage: ./images/xxx.png    # 任意
---
```

`draft` の扱い: `import.meta.env.PROD` のときに除外する。
一覧ページ・記事ページ・RSS の**3か所すべて**でフィルタすること（漏れやすい）。
共通のヘルパー（例 `src/lib/posts.ts`）に集約するとよい。

---

## 7. 実装手順

1. 新しいプロジェクトディレクトリを決める（`ws/` 配下）
2. `npm create astro@latest <dir> -- --template blog --install --no-git --skip-houston --yes`
3. `content.config.ts` の glob `base` を `./content/blog` に変更。スキーマに `draft` / `tags` を追加し `description` は任意に
4. 雛形付属のサンプル記事を削除
5. `scripts/import-posts.mjs` を作成し、`ws/blog` から取り込み
6. draft フィルタを一覧 / 記事 / RSS に適用
7. **日本語フォントの手当て**（雛形の Atkinson は日本語グリフを持たない。Noto Sans JP 等のフォールバックを global.css に入れる）
8. `<html lang="en">` → `lang="ja"`、`SITE_TITLE` / `SITE_DESCRIPTION` / `site` URL を実際の値に
9. `astro dev` で表示確認（**この時点で一度ブラウザ確認する**）
10. Vercel にデプロイ。Preview Deployment の動作確認
11. Keystatic を導入し、ブラウザ編集と画像アップロードを確認

**9 までがローカルで完結する塊**。10 以降は外部サービスを触るので、都度確認を取る。

※ 当初あった「content を別リポジトリに切り出し submodule 化」は 2026-09-01 に取りやめた（3節）。

---

## 8. 未検証・要確認事項

実装前に必ず裏を取ること。前セッションでは**未検証のまま**。

- [x] **Keystatic の `storage` を「サイトとは別のリポジトリ」に向けられるか** → **向けられる**（2026-08-31 確認）
      `repo` は `{ owner, name }`（または `'owner/name'` 文字列）を取るだけで、公式ドキュメントに
      「サイトと同一リポジトリであること」という要件は無い。構成4の前提は維持できる。
      ただし付随する制約が2つ判明:
      - GitHub モードは **Node.js が動く API ルート**を要求する（`@astrojs/vercel` アダプタが要る）。
        環境変数は `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` /
        `KEYSTATIC_SECRET` / `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` の4つ
      - ~~Keystatic は content リポジトリへ直接コミットするが、submodule はコミットを固定するため、
        サイト側の submodule ポインタを進める導線が別途必要~~
        → **2026-09-01: リポジトリを分離しない判断にしたため、この制約ごと消えた**
- [x] **Astro の glob loader の `base` をプロジェクトルート直下 `content/` にできるか**（`src/` 外）
      → **できる**（2026-08-31 / Astro 7.2.9 で確認）。`glob({ base: './content/blog' })` で
      `astro dev` / `astro build` の両方が通り、記事ページ・一覧・RSS・sitemap すべて生成された
- [x] **content リポジトリ内の相対画像に Astro の画像最適化が効くか**
      → **効く**（2026-08-31 / Astro 7.2.9 で確認）。`src/` の外にある `content/blog/images/` を
      本文と `heroImage` の両方から相対パスで参照して、dev では `/_image` 経由の webp、
      build では `/_astro/*.webp` への変換（32kB → 16kB）が確認できた
- [x] ~~**Vercel での git submodule ビルド**~~
      → **2026-09-01: 検証不要になった。**リポジトリを分離しないため submodule を使わない
- [ ] **各サービスの無料枠の現行値**（R2 10GB / Vercel Hobby 100GB 帯域 / Cloudflare Pages 等）— 変動するので採用前に確認

## 9. 決定事項（2026-08-31 / plan の Phase 0 で確定）

- [x] **新しいプロジェクトディレクトリ名** → `ws/my-blog-2`
- [x] ~~**content リポジトリの置き場** → `ws/blog-content` を新設~~
      → **2026-09-01 撤回。** リポジトリの分離自体をやめたため作らない（3節）。
        記事は同一リポジトリの `content/blog/` に置く。
        `ws/blog` を Git 管理しない下書き置き場のまま残す点は変わらず、
        `ws/blog` → `content/blog` の受け渡し工程は残る（11節の課題）
- [x] **既存 microCMS 記事を移行するか** → **しない**。新ブログは `ws/blog` の4記事から再スタート
- [x] **既存ブログの URL / 独自ドメインを引き継ぐか** → **引き継がない**。Vercel 発行の URL を使う。
      既存 Gatsby の `siteUrl` は Gatsby スターターの初期値のままで、独自ドメイン設定の形跡なし
- [ ] microCMS と既存 Gatsby をいつ止めるか → 新ブログが本番稼働してから（plan の Phase 8）

## 10. やらないこと

- 既存 Gatsby（`ws/my-blog/gatsby-microcms/`）の改修 — 触らない
- 既存 `my-blog` リポジトリへの相乗り — 新しいディレクトリで作る
- microCMS の設定変更・記事削除 — 移行方針が決まるまで手を付けない

---

## 11. 補足: `today` スキルとの接続

`ws/blog` に記事を書き出しているのは `today` スキル。
将来的にはこのスキルが**最初から frontmatter 付きの md を吐く**ようにすれば、
`import-posts.mjs` による正規化すら不要になり、
「書く → push → 公開」が一直線になる。

構成が固まったあとの改善項目として残しておく。
