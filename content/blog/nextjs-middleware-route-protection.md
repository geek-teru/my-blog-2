---
title: "Next.js 16 の Middleware でルート保護を実装してみた"
description: "認証チェックを Middleware の1箇所に寄せて、未ログインを /login に飛ばす。ログアウトは Server Action で作る。"
pubDate: 2026-08-31
tags: ["Next.js", "Supabase", "認証", "Middleware"]
draft: true
---

## はじめに

タスク管理アプリを引き続き作っていきます。
今回はルート保護の実装です。

Middleware とは、リクエストがページに届く前に必ず通る処理です。
自分はインフラをやってきたのでミドルウェアといえばApacheとかTomcatを想像します笑

このMiddlewareに認証チェックを1つ置いておけば、**ページをいくら増やしても保護が自動でついてきます**。

この記事では、Next.js 16（App Router）と Supabase の組み合わせで、未ログインの場合は `/login` に飛ばしたり。
あわせて、ログアウトを Server Action で作り、ログイン後の画面にプロフィールを出すところまでやります。

Supabase のセットアップと `@supabase/ssr` の使い方は[別の記事](/blog/nextjs-supabase-google-oauth-local/)に書いたので、そちらは前提にします。

## ルート保護とは

ログインしていない人に、そのページを見せないようにする仕組みです。
ログイン画面を作っただけでは URL を直接打たれてしまいます。リンクを隠すのは防御になりません。

**リクエスト先のパス** と **セッションの有無** の組み合わせで処理が決まります。

| リクエスト先                          | 処理                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 静的アセット（`_next/static` や画像） | セッションを見ない。そもそも Middleware を通さない                                                                                    |
| `/login`、`/auth/*`                   | セッションが無くても通す。トークンの更新だけする                                                                                      |
| それ以外のパス                        | セッションが無ければ **`/login` へリダイレクト（307）**。セッションがあれば通し、期限が近ければトークンを更新して新しい Cookie を返す |

## Server Actions とは

フォームの送信やボタンの操作を、**サーバー側の関数として直接書ける** Next.js の仕組みです。

普通なら API エンドポイントを作って `fetch` で叩きますが、Server Actions なら関数に `"use server"` を付けて `<form action={...}>` に渡すだけで済みます。ルーティングもリクエストの組み立ても要りません。

今回のログアウトのように、**Cookie を書き換える処理**と相性が良いです。Server Component は Cookie を書き込めませんが（[理由は前の記事](/blog/nextjs-supabase-google-oauth-local/)）、Server Action はレスポンスを組み立てる前に動くので書けます。

おまけに `<form>` なので、**JavaScript が無効でも動きます**。

## やってみる

### 1. Middleware の入口を作る

Next.js が Middleware として認識するのは `src/middleware.ts` という決まった場所だけです。

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

`matcher` で静的アセットを外しているのは、画像1枚読むたびに認証チェックを走らせないためです。

一方で `/login` と `/auth/*` は `matcher` から外していません。判定関数の中で分岐させます。

```ts
const isPublicPath =
  pathname.startsWith("/login") || pathname.startsWith("/auth");

if (!user && !isPublicPath) {
  url.pathname = "/login";
  return NextResponse.redirect(url);
}
```

これらのパスでも**トークンの更新自体はやりたい**からです。とくに `/auth/callback` はログイン直後にセッションを Cookie へ書き込む場所なので、Middleware を通す必要があります。

なお、ここで全パスを保護対象にすると、`/login` へのリダイレクトがまた弾かれて無限ループします。保護と除外はセットで考えるところです。

**こうなればOK。** シークレットウィンドウで `http://localhost:3000/` を開くと `/login` に飛びます。Cookie を共有しないので、「本当にセッションが無い」状態をそのまま作れます。

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

肝は `revalidatePath` です。これが無いと Server Component のキャッシュが残り、**ログアウトしたのに古いプロフィールが表示される**ことがあります。

呼び出し側は `<form>` に渡すだけです。

```tsx
<form action={signOut}>
  <Button type="submit" variant="outline" className="w-full">
    ログアウト
  </Button>
</form>
```

`onClick` も `fetch` も書いていません。

**こうなればOK。** ボタンを押すと `/login` に戻ります。そのままブラウザの戻るボタンを押しても `/` には入れません。セッションが消えているので、ステップ1の Middleware が弾いてくれます。

### 3. ログイン後の画面を作る

Server Component から Supabase を叩いて、プロフィールを表示します。

```tsx
// src/app/page.tsx
const supabase = await createClient();

const {
  data: { user },
} = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from("profiles")
  .select("display_name, avatar_url")
  .eq("id", user!.id)
  .single();
```

サーバーで取得して HTML に埋め込むので、ローディング表示は要りません。ブラウザに届いた時点で値が入っています。

アイコンは頭文字でフォールバックさせます。Google から返る `raw_user_meta_data` にアイコンの URL が入らないことがあり、その場合 `avatar_url` は null になるからです。

```tsx
{
  profile?.avatar_url ? (
    <img src={profile.avatar_url} alt="" className="size-16 rounded-full" />
  ) : (
    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
      {displayName.slice(0, 1)}
    </div>
  );
}
```

`next/image` は使っていません。外部ドメインの画像を通すには `next.config.ts` に許可設定が要るので、アイコン1枚なら素の `<img>` で足ります。

**こうなればOK。** ログイン済みのウィンドウで `/` を開くと、頭文字アイコン・表示名・メールアドレス・ログアウトボタンが並びます。

なお、この状態でコミットしたら CI の整形チェックが落ちました。

```
[warn] src/app/page.tsx
Code style issues found in the above file.
```

`prettier-plugin-tailwindcss` が Tailwind のクラスを規約どおりの順に並べ替えるためです。中身は変わらないので、書いたら `npm run format` を通してからコミットすれば済みます。

## まとめ

- **書き忘れによる穴がなくなった。** ページごとに認証チェックを書く方式だと、画面が増えるほど漏れます。Middleware に寄せておけば、新しいページを足しても自動で保護されます
- **未ログインの画面がちらつかない。** 描画が始まる前にリダイレクトが決まるので、中身は一瞬も表示されません
- **次は RLS のテストを書きます。** ルート保護が守るのは画面だけで、データを守るのは RLS です。「他人のプロフィールが読めないこと」をテストで固定してから、クラウドにデプロイする予定です
