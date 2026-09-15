---
title: "GitHubのsubクレームの形式が変わっててめちゃくちゃハマった"
description: "GitHub Actions から AWS に OIDC でログインできない。sub クレームの形式変更が原因だった"
pubDate: 2026-09-08
tags: ["GitHub Actions", "AWS", "OIDC", "IAM"]
heroImage: "./images/github-actions.png"
draft: false
---

## はじめに

GitHub Actions から AWS に OIDC でログインしようとしたら `Not authorized to perform sts:AssumeRoleWithWebIdentity` が出続けて、めちゃくちゃハマりました。

厄介だったのは、**同じ AWS アカウントの同じロールを、別のリポジトリからは問題なく引き受けられていた**ことです。ロール ARN もアカウントも `aud` も一致していて、信頼ポリシーは owner 配下を丸ごと許可する `repo:<owner>/*:*` なのに、その日作ったリポジトリだけが弾かれます。

原因は GitHub 側の `sub` クレームの形式変更でした。実際に飛んでいるクレームを出力して突き止めたので、その手順を残します。

## sub クレームはIAMロールのプリンシパル

GitHub Actions が発行する OIDC トークンには `sub` というクレームが入っていて、どのリポジトリが発行したかを表します。

AWS 側は IAM ロールの信頼ポリシーでこの値を条件にして、引き受けを許すかどうかを決めます。

信頼ポリシーはこの文字列にマッチすればアクションを許可する仕組みです。

## 起きたこと

元の信頼ポリシーは以下の通り。owner 配下ならどのリポジトリでも許可する形でした。(アカウントIDはダミー)

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:{owner_name}/*:*"
    }
  }
}
```

ワークフロー側は `role-to-assume` にロールの ARN を渡すだけです。

```yaml
- name: AWS login
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${{ vars.AWS_CICD_ROLE_ARN }} # デバッグ用にシークレットではなくvarに変更
    aws-region: ap-northeast-1
```

それでもログはこうなります。

```text
Run aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-actions-cicd-role
    aws-region: ap-northeast-1
    audience: sts.amazonaws.com
Error: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

ARN は読めている。プリンシパルには `repo:{owner_name}/*:*` と書いてあるのに拒否され、？？？という状態でした。

## 実際に飛んでいるクレームを見る

こうなったらJWTをでコードしての中身を見てみます。

`id-token: write` があれば、ランナーの中からトークンを取得してデコードできます。AWS login の前に置きます。

```yaml
- name: Show OIDC claims
  run: |
    TOKEN=$(curl -sSf \
      -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
      "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" | jq -r .value)
    PAYLOAD=$(echo "$TOKEN" | cut -d. -f2 | tr '_-' '/+')
    while [ $(( ${#PAYLOAD} % 4 )) -ne 0 ]; do PAYLOAD="${PAYLOAD}="; done
    echo "$PAYLOAD" | base64 -d | jq '{sub, aud, repository, environment, ref, event_name}'
```

JWT は 標準の base64ではなくbase64url でエンコードされています。
base64 → base64url の違いは 「+」→「-」、「/」→「\_」、「=」→「」です。

なので、`tr '_-' '/+'` で「\_」を「/」に「-」を「+」に直してからパディング「=」を足します。

結果、出力されたのが以下です。（IDの数字はダミー）

```json
{
  "sub": "repo:{owner_name}@1234567/{repo_name}@89012345:environment:dev",
  "aud": "sts.amazonaws.com",
  "repository": "{owner_name}/{repo_name}",
  "environment": "dev",
  "ref": "refs/heads/test",
  "event_name": "workflow_dispatch"
}
```

owner 名とリポジトリ名の後ろに`@1234567` が付いています。`repo:{owner_name}/` という形式が、`repo:{owner_name}@1234567/` になっていました。

これは、2026年7月15日以降に作成されたリポジトリの既定になった形式らしいです。
7/15 より前のリポジトリはオプトインしない限り旧形式のままなので、別リポジトリだけ通っていたのはこれが理由でした。

https://github.blog/changelog/2026-04-23-immutable-subject-claims-for-github-actions-oidc-tokens/

## プリンシパルを直す

実際に飛んでいる `sub` に合わせます。owner の ID は固定して、リポジトリ名・リポジトリ ID・環境名はワイルドカードにしました。

```json
"token.actions.githubusercontent.com:sub": [
    "repo:{owner_name}/{other_repo_name}:*",
    "repo:{owner_name}@1234567/*:environment:*"
]
```

上記の通り修正すると動きました。

## まとめ

- 2026年7月15日以降に作った GitHub リポジトリは `sub` が `<name>@<id>` 形式になる。信頼ポリシーを名前だけで書いていると一致しない
- クレームは `ACTIONS_ID_TOKEN_REQUEST_URL` から取ってデコードして確認すると確実！
