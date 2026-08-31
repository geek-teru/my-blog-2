---
title: "Next.js 16 の Middleware でルート保護を実装してみた"
description: "前回、Next.js 16 と Supabase で Google ログインを実装しました（前回の記事）。"
pubDate: 2026-08-31
tags: ["Next.js", "Supabase", "認証", "Middleware"]
draft: true
---
## はじめに

> ここは下書きです。動機まわりはご自身の言葉に差し替えてください。

前回、Next.js 16 と Supabase で Google ログインを実装しました（[前回の記事](/blog/nextjs-supabase-google-oauth-local/)）。

ただ、ログイン画面を作っただけでは何も守れていません。URL を直接叩けば、未ログインでもページが開けてしまいます。そこで今回は **Middleware でルート保護**を入れました。

あわせて、ログイン後に表示する画面と**ログアウトを Server Action** で作っています。これで「入れない人は入れない、入った人は自分の情報が見える」という認証の一周が完成します。

Supabase のセットアップ、`@supabase/ssr`、Cookie の扱いは前回の記事で書いたので、そちらを前提に進めます。

## ルート保護とは

ログインしていない人に、そのページを見せないようにする仕組みです。「ルート」は route（URL のパス）で、root ではありません。

なぜ要るかというと、ログイン画面を作っただけでは URL を直接打たれて終わりだからです。リンクを隠すのは防御になりません。

判定を置く場所は2通りあります。

| 方式 | 挙動 | 弱点 |
| --- | --- | --- |
| 入口で一括（Middleware） | 全リクエストが必ず通る | 除外パスを間違えると自分も締め出す |
| ページごとに個別 | 柔軟に書ける | 書き忘れたページが穴になる |

今回は前者にしました。後者は画面が増えるほど確実に漏れます。しかも動作確認はログイン済みでやるので、**穴が空いていても気づけません**。

ひとつ大事な区別があります。**ルート保護はセキュリティではありません。**

| 層 | 守るもの | 破られたら |
| --- | --- | --- |
| ルート保護 | 画面の表示 | 画面は見えるが、データは取れない |
| RLS / サーバー側の権限チェック | データそのもの | 他人の情報が読める |

ルート保護は画面を出し分けているだけで、API を直接叩かれれば素通りします。データを守るのは DB の RLS 側です。ここを取り違えると「画面は守れているのにデータは丸見え」になります。

## Server Actions とは

フォームの送信やボタンの操作を、**サーバー側の関数として直接書ける** Next.js の仕組みです。

普通なら API エンドポイントを作って `fetch` で叩きますが、Server Actions では関数に `"use server"` を付けて `<form action={...}>` に渡すだけで済みます。API のルーティングもリクエストの組み立ても要りません。

今回のログアウトのように、**Cookie を書き換える処理**と相性が良いです。Server Component は Cookie を書けませんが（前回の記事に書いたとおり）、Server Action はレスポンスを組み立てる前に動くので書き込めます。

おまけとして、`<form>` なので **JavaScript が無効でも動きます**。

## やってみる

### 1. Middleware の入口を作る

Next.js が Middleware として認識するのは `src/middleware.ts` という決まった場所だけです。実処理は前回作った `lib/supabase/middleware.ts` にあるので、ここは入口に徹します。

```ts
// src/middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

`matcher` で静的アセットを外しているのは、画像1枚読むたびに認証チェックが走るのを避けるためです。全リクエストで Supabase に問い合わせると無駄が積み上がります。

一方で `/login` と `/auth/*` は `matcher` では外していません。判定関数の中で分岐させています。

```ts
const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/auth");

if (!user && !isPublicPath) {
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
```

これらのパスでも**トークンの更新自体はやりたい**からです。とくに `/auth/callback` はログイン直後にセッションを Cookie へ書き込む場所なので、Middleware を通す必要があります。

ちなみに、ここで全パスを保護対象にすると `/login` へのリダイレクトがまた弾かれて無限ループします。除外はセットで考えるところです。

**確認。** シークレットウィンドウで `http://localhost:3000/` を開くと `/login` に飛びました。Cookie を共有しないので「本当にセッションが無い」状態を作れます。

curl でも見ておきます。

```bash
curl -s -o /dev/null -w "status=%{http_code} redirect=%{redirect_url}\n" http://localhost:3000/
```

```
status=307 redirect=http://localhost:3000/login
```

307 が返っていれば効いています。

### 2. ログアウトを Server Action で作る

`"use server"` を付けたファイルに関数を置きます。

```ts
// src/features/auth/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
```

`revalidatePath` を入れているのがポイントです。これが無いと Server Component のキャッシュが残り、**ログアウトしたのに古いプロフィールが表示される**ことがあります。

呼び出し側は `<form>` に渡すだけです。

```tsx
<form action={signOut}>
  <Button type="submit" variant="outline" className="w-full">
    ログアウト
  </Button>
</form>
```

`onClick` も `fetch` も書いていません。

**確認。** ボタンを押すと `/login` に戻りました。そのままブラウザの戻るボタンを押しても `/` には戻れません。セッションが消えているので Middleware が弾いてくれます。

### 3. ログイン後の画面を作る

Server Component から Supabase を叩いて、プロフィールを表示します。

```tsx
// src/app/page.tsx
const supabase = await createClient();

const { data: { user } } = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from("profiles")
  .select("display_name, avatar_url")
  .eq("id", user!.id)
  .single();
```

サーバーで取得して HTML に埋め込むので、ローディング表示は要りません。ブラウザに届いた時点で値が入っています。

アバターは頭文字でフォールバックさせました。

```tsx
{profile?.avatar_url ? (
  <img src={profile.avatar_url} alt="" className="size-16 rounded-full" />
) : (
  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
    {displayName.slice(0, 1)}
  </div>
)}
```

前回、Google の `raw_user_meta_data` にアイコン URL が入っておらず `avatar_url` が null になることが分かっていたので、最初からこの形にしています。

`next/image` は使いませんでした。外部ドメインの画像を扱うには `next.config.ts` に許可設定を足す必要があり、アイコン1枚のために設定を増やす気になれなかったからです。

**確認。** ログイン済みのウィンドウで `/` を開くと、頭文字アイコン・表示名・メールアドレス・ログアウトボタンが並びました。

なお、この状態で CI の整形チェックが落ちました。

```
[warn] src/app/page.tsx
Code style issues found in the above file.
```

`prettier-plugin-tailwindcss` が Tailwind のクラス順を規約どおりに並び替えるためです。中身は変わりません。クラス順を手で覚える意味はないので、書いたら `npm run format` を通す運用にするのが正解でした。

```diff
- className="bg-muted text-muted-foreground flex size-16 ..."
+ className="flex size-16 ... bg-muted text-muted-foreground"
```

## まとめ

- **書き忘れによる穴がなくなった。** ページごとに認証チェックを書く方式だと、画面が増えるほど漏れます。Middleware に寄せたことで、新しいページを追加しても自動で保護されます
- **未ログインの画面がちらつかない。** 描画前にリダイレクトが決まるので、中身が一瞬も表示されません
- **次は RLS のテストを書きます。** ルート保護は画面を守るだけで、データを守るのは RLS です。「他人のプロフィールが読めないこと」をテストで固定してから、クラウドにデプロイする予定です
