---
title: インターネット広告事業の業務システム立ち上げ
branch: freelance
from: '2024.04'
to: '2025.06'
summary:
  - 大手インターネット広告事業と大手銀行の協業プロダクトで、銀行の数千万人の顧客データを活用し他社の広告を配信する B2B のソリューション。
  - 事業をスケールさせるために業務システムを 0→1 で立ち上げるフェーズで参画し、データ分析基盤構築と管理アプリケーションを開発。
---

### 銀行の高いセキュリティ要件を満たすインフラの構築

- VPC の閉域サブネット、VPC エンドポイントの設計、構築
- IAM ユーザーのシークレットキー運用廃止。SAML ユーザーに IAM ロールを AssumeRole し最小権限を付与
- VPC エンドポイント ID やプリンシパル ID などで制御する複雑な IAM ポリシーの設計
- Lambda + CloudWatch Logs で機密性が高い情報へのアクセスなどのリスクイベント検知
- VPC フローログや CloudTrail ログを Glue データカタログで管理し Athena で検索
- AWS Config で AWS リソースの構成変更を検知
- Terraform でインフラの構成をコード管理、GitHub Actions で plan / apply を自動化

### 銀行データを連携し効果的にターゲティングするためのデータ分析基盤

- S3 と Glue データカタログでデータレイクを構築
- Redshift でデータウェアハウスを構築
- SageMaker Studio で分析環境を構築
- Step Functions と Glue ジョブ、Lambda で ETL パイプラインを構築
- Python の aws-glue-libs や PySpark を使った ETL ジョブの実装
- Terraform で AWS リソースをコード管理、GitHub Actions で plan / apply を自動化
- ETL ジョブのテストを実装し、品質担保とともにトライ&エラーのサイクルを早める

### 顧客管理や配信実績の管理、評価するための業務アプリケーション開発

- Go 言語 Echo フレームワークによる RESTful API の開発
- クリーンアーキテクチャに沿ったディレクトリ、インターフェースの設計
- CRUD 機能実装
- AWS Cognito 認証し JWT を検証、ユーザー情報を取得する認証機能実装
- テストの実装。GitHub Actions を用いたテスト自動化
- GitHub Actions を用いた ECS のビルドデプロイ自動化
- ALB + ECS + RDS Aurora でマルチ AZ 構成
- ECS サイドカーコンテナでログ連携
