# Profile ページ 仕様

`/profile` に自己紹介ヘッダーとスキルセットを追加する。職務経歴は `/career` に既にあるので、
このページには持ち込まずリンクで繋ぐ。

## 決めたこと

| 論点 | 決定 | 理由 |
| --- | --- | --- |
| アイコンの配色 | **ブランドカラー** | 各ロゴを公式色で出す。色は `skills.ts` の `color` に持たせ、`currentColor` 経由で当てる。当初はモノクロにしたが、識別しやすさを採ってカラーに変更した |
| 習熟度の表示 | **出さない** | 参考ページと同じくチップを並べるだけ。基準が主観的になるものを持ち込まない |
| ページ構成 | 自己紹介ヘッダー ＋ スキル | 職務経歴は `/career` にあるので重複させない |

## 画面構成

上から順に、

1. **自己紹介ヘッダー** — アバター / 名前 / 外部リンク / 紹介文
2. **スキル** — カテゴリごとのカードにチップを並べる
3. **このサイトについて** — 既存の文章をそのまま残す

`/career` への導線はヘッダーの紹介文の直後に1行置く。

## データ構造

`src/data/skills.ts` に置く。`content/career/` のようなコンテンツコレクションにはしない。
コレクションは本文（業務詳細）を持つものの入れ物で、スキルは本文が無く、並び順そのものが意味を持つため。

```ts
export type Skill = {
  /** チップに出す表示名 */
  name: string;
  /** Simple Icons のスラッグ。省略するとテキストだけのチップになる */
  icon?: string;
};

export type SkillGroup = {
  title: string;
  items: Skill[];
};

export const skillGroups: SkillGroup[] = [ /* ... */ ];
```

### カテゴリの初期値

`content/career/` の記述と記事のタグから拾ったもの。インフラ／SRE を先頭に置き、
フロントエンドを後ろにする。参考ページはフロントエンド始まりだが、経歴が違うので順番を変える。

| カテゴリ | 中身 |
| --- | --- |
| クラウド / インフラ | AWS, Google Cloud, vSphere, Nginx, Apache |
| IaC / CI/CD | Terraform, Ansible, GitHub Actions, Jenkins |
| 監視 / 運用 | Datadog, Fluentd, CloudWatch |
| バックエンド / DB | Java, Ruby, PostgreSQL, Supabase |
| フロントエンド | Next.js, React, TypeScript |
| ツール | Git, GitHub, Docker, WSL, Slack |

中身は後から `skills.ts` を編集すれば増減できる。ページ側は配列を舐めるだけにする。

## アイコン

`astro-icon` ＋ `@iconify-json/simple-icons` を使う。ビルド時に SVG をインライン展開する方式で、
実行時 JS も外部リクエストも増えない。静的配信のこのサイトに合う。

```
npm i -D astro-icon @iconify-json/simple-icons
```

CDN から読む方式とアイコンフォントは採らない。リクエストが増え、読み込み前後でレイアウトが動くため。

### ロゴが無いものの扱い

**Simple Icons に全スキルのロゴがあるわけではない。** vSphere、Blue/Green デプロイ、監視設計、
REST API などは存在しない。

`icon` を省略したら**テキストだけのチップ**にフォールバックする。チップの高さと余白はアイコン有無で
変えないので、混在しても行が揃う。「アイコンが無いから載せない」という判断はしない。

### 色

Simple Icons のパスは `fill="currentColor"` なので、チップ側で `color` を指定すれば色が付く。
**`@iconify-json/simple-icons` に色の情報は入っていない**ため、ブランドカラーは `skills.ts` に直接持つ。

公式の `simple-icons` パッケージから引くことも試したが、AWS・CloudWatch・Slack は
新しい版で削除されており（商標方針による）色が引けなかった。アイコン本体を持つ
`@iconify-json` 側とは収録数がずれるので、パッケージには依存させない。

`color` を省略したスキルは本文色を継ぐ。

## スタイル

`global.css` の既存トークンだけで組む。**新しい色は足さない。**

- カードのグリッド: `repeat(auto-fit, minmax(16rem, 1fr))`、`--shell` のレール内
- カード: 背景 `--bg-subtle` / 枠 `1px solid rgb(var(--gray-light))` / 角丸 `--radius`
- チップ: `display: inline-flex`、アイコンは `1em` 角、ラベルとの間隔は `0.35rem`
- モバイル（1列）まで `auto-fit` で自然に落ちるので、メディアクエリは原則書かない

ダークモード対応は現状サイトに無いので、今回も入れない。

## アクセシビリティ

- アイコンは装飾なので `aria-hidden="true"`。読み上げ対象はチップのテキスト
- チップはリンクにしない。押せそうに見えて押せない要素を作らない
- 色だけで情報を区別しない（今回は習熟度を出さないので該当なし）

## 実装メモ

- `.astro` のページは `headings` を渡さないため、h2 を増やしても目次は出ない
  （`BlogPost.astro` の `hasToc` は `headings` から判定している）。`career.astro` と同じ挙動になる
- `WipNotice` は中身が入った時点で外す

## 用意してもらうもの

ヘッダーは以下が無いと組めない。決まるまでは仮置きで進める。

| 項目 | 状況 |
| --- | --- |
| アバター画像 | **リポジトリに無い。** `src/assets/` には記事用のプレースホルダしかない。無い場合は頭文字のモノグラムで代替する |
| 外部リンク | GitHub（`geek-teru`）は確認済み。X / Zenn / note / SpeakerDeck などの有無は未確認 |
| 紹介文 | 未定。2〜4行程度 |

## やらないこと

- 職務経歴を `/profile` に再掲しない（`/career` にある）
- 習熟度のレベル表記・星・バーを出さない
- スキルのチップから外部サイトへリンクしない
- ダークモード対応を今回入れない
