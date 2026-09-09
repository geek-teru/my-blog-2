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

### カテゴリ

| カテゴリ | 中身 |
| --- | --- |
| Infrastructure | AWS, Azure, Google Cloud, vSphere, Terraform, Ansible, VPC, Route 53, ALB, ECS, Lambda, AWS Batch, API Gateway, Amplify, Step Functions |
| Security | IAM, CloudTrail, Config, AWS WAF, Network Firewall, Cognito |
| Database / Data Platform | MySQL, PostgreSQL, Oracle, RDS, Redshift, S3, Athena, Glue, PySpark, QuickSight |
| Tools / CI/CD | Git, GitHub, GitHub Actions, Jenkins, CodeBuild, Docker |
| Backend | Go, PHP, Python, Echo, Laravel |
| Monitoring / Logs | Datadog, CloudWatch, CloudWatch Logs, Fluentd |

全46項目のうち **ロゴがあるのは33個、残る13個はテキストだけのチップ**になる。
中身は `skills.ts` を編集すれば増減できる。ページ側は配列を舐めるだけにする。

## アイコン

`astro-icon` ＋ `@iconify-json/simple-icons` を使う。ビルド時に SVG をインライン展開する方式で、
実行時 JS も外部リクエストも増えない。静的配信のこのサイトに合う。

```
npm i -D astro-icon @iconify-json/simple-icons
```

CDN から読む方式とアイコンフォントは採らない。リクエストが増え、読み込み前後でレイアウトが動くため。

### ロゴが無いものの扱い

**Simple Icons に全スキルのロゴがあるわけではない。** VPC、AWS Batch、Step Functions、
CloudTrail、Config、AWS WAF、Network Firewall、Athena、Glue、QuickSight、CodeBuild、
Echo、CloudWatch Logs の13個が該当する。

`icon` を省略したら**テキストだけのチップ**にフォールバックする。チップの高さと余白は
アイコン有無で変えないので、混在しても行が揃う。「アイコンが無いから載せない」という
判断はしない。実務の中心にあるものほど、この判断で抜け落ちる。

### 色

Simple Icons のパスは `fill="currentColor"` なので、チップ側で `color` を指定すれば色が付く。
**`@iconify-json/simple-icons` に色の情報は入っていない**ため、色は `skills.ts` に直接持つ。

入れてよいのは**公式の `simple-icons` パッケージで照合できた値だけ**とする。照合できなかった
もの（Azure、Oracle）は空にして本文色を継がせる。**推測した hex を書かない。**

AWS のサービスは一律で黒にする。サービスごとの公式色は照合する手段が無く、十数個の
推測値を並べることになるため。Ansible と Jenkins も赤系が主張しすぎるので黒に落とす。
公式色を外している行にはコメントで併記する。

なお `@iconify-json/simple-icons`（3,732 個）と `simple-icons`（3,459 個）では収録数が
ずれており、AWS 系・Slack・Azure・Oracle は後者に無い。**前者を上げたタイミングで
アイコンが消える可能性がある**（astro-icon はビルドを落とすので気づける）。

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
