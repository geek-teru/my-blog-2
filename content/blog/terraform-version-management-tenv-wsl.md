---
title: "ローカルのTerraform実行環境が古すぎたので整備した"
description: "required_version と .terraform-version でバージョンを二重に固定して、WSL に tenv を入れる。リポジトリに入っただけで正しい Terraform に切り替わる状態を作るまでの手順。"
pubDate: 2026-09-05
tags: ["Terraform", "tenv", "WSL", "IaC"]
draft: false
---

## はじめに

ローカルのTerraform実行環境が古すぎたので整備してみました。

現在の最新バージョンは1.16.1で、手元は 1.11.4、リポジトリの宣言は `>= 1.5.0` でした。相当古いです。

最新バージョンにアップデートするとともに、Terraformのバージョン管理ツールも導入し直します。

バージョン管理はtfenvというツールを使っていましたが、更新が止まっているのでtenvというバージョン管理ツールに乗り換えます。

## tenv とは

`.terraform-version` を読んで、Terraform 本体を自動でインストール・切り替えしてくれる Go 製のバージョンマネージャです。Terraform だけでなく OpenTofu・Terragrunt・Atmos というTerraform関連のツールもサポートしています。

tenv も tfenv と同様に `.terraform-version` にバージョンを指定しておくことで利用するTerraformのバージョンを強制できます。

仕組みはシムです。`tenv` 本体とは別に `terraform` という名前の小さなバイナリを PATH に置き、それが実行時に「今いるディレクトリではどのバージョンか」を判定して本物に処理を渡します。**だから普段のコマンドは `terraform` のままで変わりません。**

解決の順番（優先順位）は以下の通りです。

1. 環境変数（`TFENV_TERRAFORM_VERSION` など）
2. カレントディレクトリから**親を遡って**見つかった `.terraform-version`
3. `.tf` の `required_version`
4. グローバル既定（`~/.tenv/Terraform/version`）

## やってみる

### 1. WSL に tenv を入れる

自分の環境はWindowsのWSLなので以下のように実行しました。

```bash
curl -fsSL -o tenv.tar.gz \
  https://github.com/tofuutils/tenv/releases/download/v4.15.1/tenv_v4.15.1_Linux_x86_64.tar.gz
tar xzf tenv.tar.gz
sudo install -m 0755 tenv terraform tofu /usr/local/bin/
```

```bash
tenv version
# tenv version v4.15.1
```

### 2. required_version を設定

ルートモジュールにあたる環境ディレクトリを、マイナー固定に変えます。

```hcl
terraform {
  required_version = "~> 1.16.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.74.0"
    }
  }
}
```

### 3. .terraform-version で実行バージョンを固定する

リポジトリ直下に置きます。

```bash
echo "1.16.1" > .terraform-version
```

### 4. .terraform-version から Terraform を入れる

リポジトリの中で叩くと、バージョンを指定しなくても勝手に読んでくれます。

```bash
tenv tf install
```

### 5. CI でも同じファイルを見るようにする

CI では tenv を使いません。`setup-terraform` は HashiCorp 公式の GitHub Action で、渡されたバージョンの Terraform をランナーにインストールして PATH に置きます。以降の step の `terraform` がそのバージョンになる、という仕組みです。

ただし `.terraform-version` を読む機能は持っていないので、ファイルを読む step を挟んで渡します。

```yaml
- name: Resolve Terraform version
  id: terraform-version
  run: echo "version=$(cat "$GITHUB_WORKSPACE/.terraform-version")" >> "$GITHUB_OUTPUT"

- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: ${{ steps.terraform-version.outputs.version }}
```

`$GITHUB_WORKSPACE` を付けているのは、ジョブに `defaults.run.working-directory` が設定されていてもリポジトリ直下を指すようにするためです。

バージョンには `~1.16.0` のような制約や `latest` も渡せます。`latest` だと Terraform が上がった日に `required_version` で落ちるので、ファイルから読んだ固定値にしています。

## まとめ

- `tenv`を導入してTerraformのバージョン管理を整備した。
- `.terraform-version` をSingle Source of Truth：信頼できる唯一の情報源とすることで、チームでの開発やCICDなど分散環境でもバージョンを意識する場面が消える
