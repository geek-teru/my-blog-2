---
title: "Next.js 16 + Supabase のローカル環境で Google ログインを実装してハマった4点"
description: "タスク管理アプリを作るにあたって、まず認証だけを独立して完成させたかったのです。"
pubDate: 2026-08-30
tags: []
draft: false
---
## 3行まとめ

- Next.js 16 と Supabase のローカル環境（Docker）で Google OAuth ログインを実装した
- 一番詰まったのは「画面は出るのにボタンが無反応」。原因は Next.js 開発サーバーが `127.0.0.1` からの `/_next/*` を 403 で拒否し、ハイドレーションが失敗していたこと
- ログイン成功。DB トリガーによる `profiles` の自動生成まで動作確認できた

## やりたかったこと

タスク管理アプリを作るにあたって、まず認証だけを独立して完成させたかったのです。

タスク機能と同時に進めると、ログインの不具合なのかデータの不具合なのか切り分けにくくなります。認証はデプロイまで通して単独で検証できる単位なので、ここで区切りました。

クラウドは使わず、Supabase のローカル環境で完結させます。壊しても `supabase db reset` でやり直せるためです。

## 環境

| 項目 | バージョン |
| --- | --- |
| OS | Windows 11 + WSL2 |
| Node.js | 22.14.0 |
| Next.js | 16.3.3 (App Router) |
| Supabase CLI | 2.116.0 |
| @supabase/ssr | 0.12.5 |
| Docker | 28.0.1 (Docker Desktop) |

## やってみる

### 1. Supabase のローカル環境を立ち上げる

Docker Desktop を起動してから実行します。

```bash
npx supabase init
npx supabase start
```

初回はイメージのダウンロードで十数分、数 GB 消費します。完了すると12個のコンテナが立ちます。

```
db / auth / rest / realtime / storage / studio / kong /
inbucket(メール受信箱) / pg_meta / edge_runtime / vector / analytics
```

Supabase は Postgres 単体ではなく、複数サービスの集合体だと実感します。管理画面（Studio）は `http://127.0.0.1:54323` で開きます。

### 2. Google OAuth クライアントを作る

Google Cloud Console で OAuth クライアント（種別: ウェブアプリケーション）を作成します。

承認済みのリダイレクト URI には **Supabase の URL** を登録します。

```
http://127.0.0.1:54321/auth/v1/callback
```

ここが最初の落とし穴になりやすいところです。Next.js の 3000 番ではありません。認証は次の順で戻ってきます。

```
アプリ → Google → Supabase(54321) → アプリ(3000)
```

公開ステータスは「テスト中」のままにし、自分の Google アカウントをテストユーザーに登録しました。こうするとテストユーザー以外は OAuth フローを完了できず、実装なしでアクセスを制限できます。

### 3. config.toml に Google プロバイダを設定する

`supabase/config.toml` に追記します。シークレットは直接書かず環境変数を参照させます。このファイルはコミットするためです。

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_GOOGLE_SECRET)"
# ローカルでの Google ログインには nonce チェックの無効化が必要
skip_nonce_check = true
```

`skip_nonce_check` は `config.toml` の既定コメントに「Required for local sign in with Google auth」と書かれていました。設定ファイルのコメントは読む価値があります。

リダイレクト先の許可リストも必要です。コメントに「A list of **exact** URLs」とあるとおり、**パスまで完全一致**で書きます。

```toml
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```

環境変数は `.env.local` に置きました。CLI がこれを読むか不安でしたが、実際に起動後のコンテナを確認したところ解決されていました。

```bash
docker exec supabase_auth_<プロジェクト名> env | grep GOOGLE
```

```
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=<解決済み>
GOTRUE_EXTERNAL_GOOGLE_SKIP_NONCE_CHECK=true
```

### 4. Supabase クライアントを3つ作る

`@supabase/ssr` を入れます。

```bash
npm i @supabase/ssr @supabase/supabase-js
```

クライアントは用途ごとに3つ作ります。分けるのは整理のためではなく、**分けないと動かない**からです。

| ファイル | 実行場所 | Cookie の扱い |
| --- | --- | --- |
| `client.ts` | ブラウザ | ブラウザ任せ（指定不要） |
| `server.ts` | サーバー（Server Component / Action / Route Handler） | リクエストヘッダから読む。書き込みは失敗しうる |
| `middleware.ts` | サーバー（全リクエストの入口） | 読み書き両方できる |

Server Component は Cookie を書き込めません。HTML の生成が始まった時点でレスポンスヘッダが送出済みで、`Set-Cookie` を後から足せないためです。

```ts
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // Server Component からは Cookie を書き込めない。
    // セッションの更新は Middleware が行うため、ここでは無視してよい。
  }
}
```

トークンの更新を Middleware に任せるのはこの制約が理由です。

なお、ルート保護の判定には `getSession()` ではなく `getUser()` を使います。前者は Cookie の中身をそのまま信用しますが、後者は Supabase に問い合わせて検証します。

### 5. profiles テーブルをトリガーで自動生成する

Supabase の認証情報は `auth.users` にありますが、このスキーマにはカラムを追加できません。そのため `public` スキーマに1対1のテーブルを作ります。

ポイントは、**行の作成をアプリではなく DB のトリガーに任せた**ことです。

```sql
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

アプリ側で「ログイン → プロフィール作成」と2段階にすると、間で失敗したときにプロフィールを持たないユーザーが生まれます。`auth.users` への INSERT と同一トランザクションで完結させれば、その状態は発生しません。

`security definer` を付けているので、トリガーは RLS を無視して INSERT できます。おかげで `profiles` に INSERT ポリシーを作る必要がありません。権限は最小のままにできます。

```sql
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
```

### 6. ログイン画面とコールバックを作る

ログインボタンは Client Component にします。Google へのリダイレクトはブラウザを動かす操作なので、サーバーからは実行できません。

```tsx
"use client";

export function GoogleLoginButton() {
  const handleClick = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      console.error(error);
      return;
    }
    window.location.assign(data.url);
  };
  // ...
}
```

`skipBrowserRedirect: true` にして自分でリダイレクトしています。ライブラリ任せにすると、失敗しても画面に何も起きず原因が追えないためです（後述の詰まりで実際に困りました）。

戻り先は Route Handler にします。Cookie の書き込みが必要だからです。

```ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

## 詰まったところ

### 1. `supabase status` に anon key が出てこない

**症状**

チュートリアルどおりに `anon key` を探しても見つかりません。

**原因**

Supabase の API キーが新形式へ移行中でした。CLI 2.116.0 の出力にはこう並びます。

```
PUBLISHABLE_KEY : sb_publishable_xxxxx
SECRET_KEY      : sb_secret_xxxxx
ANON_KEY        : eyJhbGciOiJIUzI1NiIs...   ← 旧形式も併存
```

`anon` / `service_role` が `publishable` / `secret` に置き換わりつつあり、新形式が主で表示されるようになっています。

**対処**

`PUBLISHABLE_KEY` を使うことにしました。旧 anon キーも当面は動きますが、クラウドで新規プロジェクトを作ると新形式が標準で発行されます。旧キーで組んでいると、デプロイ時に作り直すことになります。

環境変数名も実態に合わせました。

```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

### 2. `npm run gen:types` で `supabase: not found`

**症状**

```
> supabase gen types typescript --local > src/types/database.types.ts
sh: 1: supabase: not found
```

**原因**

Supabase CLI をインストールせず `npx supabase` で毎回ダウンロードして使っていました。`npm run` は `node_modules/.bin` からコマンドを探すため、`npx` と違って自動ダウンロードしません。

**対処**

devDependency として入れました。

```bash
npm i -D supabase
```

バージョンが `package-lock.json` に固定されるので、CI や別環境でも同じ挙動になります。`config.toml` の書式や CLI の出力はバージョンで変わるので、固定しておく価値があります。実際に1つめの詰まりでキー名の変更を踏んだばかりでした。

なお、失敗しても `>` によるリダイレクトが先に走るため、**0 バイトのファイルが生成されます**。次の生成で上書きされるので実害はありません。

### 3. `127.0.0.1:3000` に接続できない

**症状**

```
このサイトにアクセスできません
127.0.0.1 で接続が拒否されました。
```

`localhost:3000` では開けます。

**原因**

WSL 内で起動した開発サーバーが IPv6 のループバックだけで待ち受けていました。

```
TCP  [::1]:3000       LISTENING   ← IPv6 のみ
TCP  127.0.0.1:3000   SYN_SENT    ← IPv4 は接続できず
```

`localhost` は `::1`、`127.0.0.1` は IPv4 なので届きません。

**対処**

最終的には後述の4番とまとめて、`localhost` に統一することで解決しました。

一時的に `next dev -H 0.0.0.0` で IPv4 も待ち受けるようにしましたが、これだけでは次の問題が残りました。

### 4. 画面は表示されるのにボタンが無反応

**症状**

ログイン画面は正常に表示されるのに、ボタンを押しても何も起きません。エラーも出ません。

コンソールを見ると JS チャンクが 403 になっていました。

```
GET http://127.0.0.1:3000/_next/static/chunks/src_xxx.js → 403 Forbidden
```

**原因**

Next.js の開発サーバーには、クロスオリジンの開発リクエストを拒否する保護があります。`localhost` は既定で許可されますが、`127.0.0.1` は外部サイトと同じ扱いで弾かれます。

curl で Origin ヘッダを変えて叩くと、はっきり再現しました。

```bash
u=http://localhost:3000/_next/static/chunks/src_xxx.js
curl -s -o /dev/null -w "%{http_code}\n" "$u"                                    # 200
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: http://127.0.0.1:3000" "$u" # 403
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: http://localhost:3000" "$u" # 200
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: http://example.com" "$u"    # 403
```

HTML は返るのでページは表示されます。しかし JS が読めないためハイドレーションが完了せず、React の `onClick` が要素に結びつきません。**見た目は完成しているのにイベントだけ動かない**、という分かりにくい症状になります。

**対処**

`next.config.ts` に `allowedDevOrigins: ["127.0.0.1"]` を足してみましたが、403 は解消しませんでした。理由は特定していません。

深追いせず、**`localhost` に統一**しました。

```toml
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
```

これで3番と4番が同時に消えます。`localhost` は元々 IPv6 で待ち受けており、かつ Next.js の既定の許可オリジンでもあるからです。`-H 0.0.0.0` も `allowedDevOrigins` も不要になり、**特別な対処コードは1行も残りませんでした**。

そもそも `127.0.0.1` にこだわったのは Supabase 側の `site_url` の既定値がそれだった、というだけの理由でした。

なお、`localhost` と `127.0.0.1` はブラウザにとって別ドメインで、Cookie も別々に保存されます。**どちらかに統一されていること**が重要です。混在させると「片方だけログイン済み」という状態になります。

判断の理由は `config.toml` にコメントとして残しました。後から戻したくなったときに同じ穴に落ちないためです。

## できたこと

Google アカウントでログインでき、トリガーによる `profiles` の自動生成まで確認できました。

```
email          : <伏せ字>
profile_exists : t          ← profiles の行が自動生成された
display_name   : <伏せ字>    ← full_name から取得できた
timezone       : Asia/Tokyo  ← デフォルト値
```

アプリ側でプロフィール作成のコードを1行も書かずに行ができています。

## わかったこと

**アバター URL は取得できませんでした。** Google から返る `raw_user_meta_data` のキーを確認したところ、こうなっていました。

```
iss  sub  name  email  full_name  provider_id  email_verified  phone_verified
```

`avatar_url` も `picture` もありません。設計時点で「キー名はプロバイダによって異なるため実装時に確認する」と書いておいたのが役立ちました。画面を作る際にイニシャル表示へフォールバックさせる予定です。

**「画面は出るのにイベントが動かない」を見たら、まず Network タブで `/_next/static/chunks/` のステータスを確認する。** これが今回一番の収穫でした。ハイドレーション失敗は見た目に現れないので、コンソールとネットワークを見ないと気づけません。

**Studio や psql から見えることは、アプリから見えることを意味しません。** どちらも管理者権限で接続するので RLS を無視します。「Studio で見えるから大丈夫」という確認は成立しないので、RLS は専用のテストで検証する必要があります。

## 次にやること

- Middleware を有効化してルート保護を効かせる
- 他人の `profiles` が読めないことを確認する RLS のテストを書く
- Supabase クラウドへデプロイし、本番でもログインできることを確認する
- デプロイ後に新規サインアップを無効化する（Google 側のテストユーザー制限と二重に閉じる）
