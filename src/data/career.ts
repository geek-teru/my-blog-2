/**
 * 職務経歴。
 *
 * 元は ws/my-blog/gatsby-microcms/src/career/index.md の Markdown。
 * git のコミットグラフに見立てて描くため、見出しの階層をそのまま型に写している。
 *
 *   H1（所属の期）  → ブランチ
 *   H2（案件）      → コミット
 *   期間            → コミットの日付
 *   概要 / 業務詳細 → コミットの本文
 *
 * Markdown のまま置いて解析する手もあるが、見出しの書き方が少しでも揺れると
 * グラフの構造が崩れる。ページ1枚ぶんなので、構造を型で保証するほうを採った。
 */

/** 入れ子はひと階層だけ許す。元の Markdown がそこまでしか使っていない */
export type Bullet = string | { text: string; children: string[] };

export type DetailGroup = {
	/** 見出しの無いフラットな箇条書きもあるので任意 */
	heading?: string;
	items: string[];
};

export type Project = {
	title: string;
	/** 表示用の期間。`YYYY.MM` 形式で揃える */
	from: string;
	to: string;
	summary: Bullet[];
	details: DetailGroup[];
};

export type Branch = {
	/** グラフに出すブランチ名 */
	name: string;
	label: string;
	from: string;
	to: string;
	/** 現在も続いているブランチ。HEAD を指す */
	current?: boolean;
	projects: Project[];
};

export const CAREER: Branch[] = [
	{
		name: 'freelance',
		label: 'フリーランスエンジニアとして活動',
		from: '2020.08',
		to: '現在',
		current: true,
		projects: [
			{
				title: 'インターネット広告事業の業務システム立ち上げ',
				from: '2024.04',
				to: '2025.06',
				summary: [
					'大手インターネット広告事業と大手銀行の協業プロダクトで、銀行の数千万人の顧客データを活用し他社の広告を配信する B2B のソリューション。',
					'事業をスケールさせるために業務システムを 0→1 で立ち上げるフェーズで参画し、当初はエンジニアは 2 名体制。',
					{
						text: '構築するシステムの要件は大きく以下の 3 つ',
						children: [
							'銀行の高いセキュリティ要件を満たすインフラの構築',
							'銀行データを連携し効果的にターゲティングするためのデータ分析基盤',
							'顧客管理や配信実績の管理、評価するためのアプリケーション',
						],
					},
				],
				details: [
					{
						heading: '銀行の高いセキュリティ要件を満たすインフラの構築',
						items: [
							'VPC の閉域サブネット、VPC エンドポイントの設計、構築',
							'IAM ユーザーのシークレットキー運用廃止。SAML ユーザーに IAM ロールを AssumeRole し最小権限を付与',
							'VPC エンドポイント ID やプリンシパル ID などで制御する複雑な IAM ポリシーの設計',
							'Lambda + CloudWatch Logs で機密性が高い情報へのアクセスなどのリスクイベント検知',
							'VPC フローログや CloudTrail ログを Glue データカタログで管理し Athena で検索',
							'AWS Config で AWS リソースの構成変更を検知',
							'Terraform でインフラの構成をコード管理、GitHub Actions で plan / apply を自動化',
						],
					},
					{
						heading: '銀行データを連携し効果的にターゲティングするためのデータ分析基盤',
						items: [
							'S3 と Glue データカタログでデータレイクを構築',
							'Redshift でデータウェアハウスを構築',
							'SageMaker Studio で分析環境を構築',
							'Step Functions と Glue ジョブ、Lambda で ETL パイプラインを構築',
							'Python の aws-glue-libs や PySpark を使った ETL ジョブの実装',
							'Terraform で AWS リソースをコード管理、GitHub Actions で plan / apply を自動化',
							'ETL ジョブのテストを実装し、品質担保とともにトライ&エラーのサイクルを早める',
						],
					},
					{
						heading: '顧客管理や配信実績の管理、評価するための業務アプリケーション開発',
						items: [
							'Go 言語 Echo フレームワークによる RESTful API の開発',
							'クリーンアーキテクチャに沿ったディレクトリ、インターフェースの設計',
							'CRUD 機能実装',
							'AWS Cognito 認証し JWT を検証、ユーザー情報を取得する認証機能実装',
							'テストの実装。GitHub Actions を用いたテスト自動化',
							'GitHub Actions を用いた ECS のビルドデプロイ自動化',
							'ALB + ECS + RDS Aurora でマルチ AZ 構成',
							'ECS サイドカーコンテナでログ連携',
						],
					},
				],
			},
			{
				title: '美容サロン予約サイトの SRE エンジニア',
				from: '2020.11',
				to: '2024.03',
				summary: [
					'国内最大規模（数千万アクセス / 日）の美容サロン予約サイトの SRE エンジニア。',
					'店舗情報を掲載する B2B サービスと、エンドユーザーが予約を行う B2C サービスがある中で、B2C サービスの可用性・信頼性向上に従事。',
					'AWS とオンプレミスを併用したハイブリッド構成にて、インフラの構築・運用・保守を担当。',
					'サービスレベル維持を最優先に考え、リリース計画やコンティンジェンシープランの計画など事前準備を徹底しプロジェクトを推進。',
					'B2B サービス側のチームやアプリ開発チームなど複数チームがある体制であったため、チーム間での連携や調整、合意形成を徹底。',
				],
				details: [
					{
						heading: 'インフラの新規構築・運用保守',
						items: [
							'ALB、EC2 などの新規構築',
							'各種ミドルウェアおよび Java / Ruby 等の言語のバージョンアップ対応',
							'Web サーバー（Nginx、Apache）の運用・保守',
						],
					},
					{
						heading: 'Terraform や Ansible を用いた IaC と CI/CD の運用',
						items: [
							'Terraform を用いた AWS リソースのコード化',
							'Ansible によるインフラ設定のコード化',
							'GitHub と Jenkins を用いた CI/CD',
							'EC2 と ALB を Blue/Green デプロイ',
							'Blue/Green デプロイやカナリアリリースなどのリリース計画策定',
						],
					},
					{
						heading: '監視・ログ管理運用や障害対応',
						items: [
							'モニタリング運用、障害検知時の調査、復旧対応',
							'Datadog による監視設計および APM の導入',
							'Fluentd によるログ収集・転送設定',
							'Google Cloud（BigQuery、Cloud Functions 等）を用いたログ監視ジョブの構築',
						],
					},
					{
						heading: 'プロジェクト推進業務や関係者の調整、業務改善',
						items: [
							'内部の大玉案件であった AWS WAF の新規構築案件では案件リーダーを務め、進捗管理や課題管理などを行い遅延なく完遂',
							'Java のバージョンアップ案件でもリーダーとしてアプリチームなど関係者との調整やプロジェクト管理を行い遅延なく完遂',
							'GitHub の運用フロー改善や権限の見直しなどの業務改善も推進',
						],
					},
				],
			},
			{
				title: '保険会社の ID 管理基盤構築案件',
				from: '2020.08',
				to: '2020.10',
				summary: ['AWS 環境上に特権管理システム（iDoperation）の新規構築。'],
				details: [
					{
						items: [
							'EC2（Windows）、RDS、IAM ロールの設計、構築',
							'特権管理システム（iDoperation）のインストール作業、利用手順書の作成など',
						],
					},
				],
			},
		],
	},
	{
		name: 'sier',
		label: '新卒で大手 SIer に入社しインフラエンジニアとして従事',
		from: '2017.04',
		to: '2020.07',
		projects: [
			{
				title: '大手金融業（公社系）の既存オンプレミス vSphere 5.5 から 6.7 へのリプレイス案件',
				from: '2019.04',
				to: '2020.07',
				summary: [
					'大手金融業（準公共）のお客様向けのオンプレミス基盤 vSphere 5.5 から vSphere 6.7 へのリプレイス案件。移行対象マシンは 400 台ほど。',
					'ミッションクリティカルな基幹システムを移行するため、レプリケーションツールを利用しバックグラウンドでデータを転送し、夜間に切替を実施することで移行を完遂。',
					'レプリケーションツールが提供している RESTful API を活用し、移行オペレーションの自動化やエラー検知のスクリプトを開発。業務効率化および人為的なミスのリスク低減を実現。',
				],
				details: [
					{
						items: [
							'レプリケーションツールのサーバー構築',
							'ツールの提供する RESTful API を用いた移行オペレーション自動化ツール、異常検知ツール作成',
							'基本設計〜移行まで一連の工程を担当',
							'PL としてプロジェクトメンバ 4 名の進捗管理や課題管理、顧客折衝',
							'ベンダーへのライセンス調達などの折衝も担当',
						],
					},
				],
			},
			{
				title: '大手金融業の既存オンプレミス基盤 vSphere 環境から AWS への移行案件',
				from: '2018.11',
				to: '2019.03',
				summary: [
					'メガバンク向けに、オンプレミス vSphere 環境の AWS 移行案件を担当。',
					'プロジェクトメンバとして設計、構築フェーズに携わり、約 100VM 規模の移行を実施。',
				],
				details: [
					{
						items: [
							'移行ツールの環境構築や移行先の AWS 環境の設計、構築と移行計画を担当',
							'金融業界特有の高いセキュリティ要件を満たす IAM の権限や S3 のバケットポリシー設計、VPC や各種サービスへのプライベートリンクなどのセキュリティ設計、構築を担当',
						],
					},
				],
			},
		],
	},
];
