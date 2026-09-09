/**
 * Profile ページのスキル一覧。
 *
 * コンテンツコレクションにしていないのは、スキルが本文を持たず、並び順そのものが
 * 意味を持つため（詳細は docs/profile-page-spec.md）。
 *
 * `icon` は Simple Icons のスラッグ。**省略するとテキストだけのチップになる。**
 * Simple Icons にロゴが無いもの（VPC、CloudTrail、Athena など13個）は、
 * 無理にそれらしいロゴを当てず省略してテキストで出す。
 *
 * `color` は省略すると本文色を継ぐ。入れてあるのは公式の simple-icons パッケージで
 * 照合できた値だけで、照合できなかったもの（Azure、Oracle）は空にしてある。
 *
 * AWS のサービスは一律で黒にしている。サービスごとの公式色は照合する手段が無く、
 * 十数個の推測値を並べることになるため。Ansible と Jenkins も赤系が主張しすぎるので
 * 黒に落としてある。公式色を外している行にはコメントで併記した。
 */
export type Skill = {
	/** チップに出す表示名 */
	name: string;
	/** Simple Icons のスラッグ。無ければ省略する */
	icon?: string;
	/** ブランドカラー。省略すると本文色を継ぐ */
	color?: string;
};

export type SkillGroup = {
	title: string;
	items: Skill[];
};

/** AWS のサービスに共通で使う色 */
const AWS = '#000000';

export const skillGroups: SkillGroup[] = [
	{
		title: 'Infrastructure',
		items: [
			{ name: 'AWS', icon: 'amazonwebservices', color: AWS }, // 公式は #FF9900
			{ name: 'Azure', icon: 'microsoftazure' },
			{ name: 'Google Cloud', icon: 'googlecloud', color: '#4285F4' },
			{ name: 'vSphere', icon: 'vmware', color: '#607078' },
			{ name: 'Terraform', icon: 'terraform', color: '#844FBA' },
			{ name: 'Ansible', icon: 'ansible', color: '#000000' }, // 公式は #EE0000
			{ name: 'VPC' },
			{ name: 'Route 53', icon: 'amazonroute53', color: AWS },
			{ name: 'ALB', icon: 'awselasticloadbalancing', color: AWS },
			{ name: 'ECS', icon: 'amazonecs', color: AWS },
			{ name: 'Lambda', icon: 'awslambda', color: AWS },
			{ name: 'AWS Batch' },
			{ name: 'API Gateway', icon: 'amazonapigateway', color: AWS },
			{ name: 'Amplify', icon: 'awsamplify', color: AWS },
			{ name: 'Step Functions' },
		],
	},
	{
		title: 'Security',
		items: [
			{ name: 'IAM', icon: 'amazoniam', color: AWS },
			{ name: 'CloudTrail' },
			{ name: 'Config' },
			{ name: 'AWS WAF' },
			{ name: 'Network Firewall' },
			{ name: 'Cognito', icon: 'amazoncognito', color: AWS },
		],
	},
	{
		title: 'Database / Data Platform',
		items: [
			{ name: 'MySQL', icon: 'mysql', color: '#4479A1' },
			{ name: 'PostgreSQL', icon: 'postgresql', color: '#4169E1' },
			{ name: 'Oracle', icon: 'oracle' },
			{ name: 'RDS', icon: 'amazonrds', color: AWS },
			{ name: 'Redshift', icon: 'amazonredshift', color: AWS },
			{ name: 'S3', icon: 'amazons3', color: AWS },
			{ name: 'Athena' },
			{ name: 'Glue' },
			{ name: 'PySpark', icon: 'apachespark', color: '#E25A1C' },
			{ name: 'QuickSight' },
		],
	},
	{
		title: 'Tools / CI/CD',
		items: [
			{ name: 'Git', icon: 'git', color: '#F03C2E' },
			{ name: 'GitHub', icon: 'github', color: '#181717' },
			{ name: 'GitHub Actions', icon: 'githubactions', color: '#2088FF' },
			{ name: 'Jenkins', icon: 'jenkins', color: '#000000' }, // 公式は #D24939
			{ name: 'CodeBuild' },
			{ name: 'Docker', icon: 'docker', color: '#2496ED' },
		],
	},
	{
		title: 'Backend',
		items: [
			{ name: 'Go', icon: 'go', color: '#00ADD8' },
			{ name: 'PHP', icon: 'php', color: '#777BB4' },
			{ name: 'Python', icon: 'python', color: '#3776AB' },
			{ name: 'Echo' },
			{ name: 'Laravel', icon: 'laravel', color: '#FF2D20' },
		],
	},
	{
		title: 'Monitoring / Logs',
		items: [
			{ name: 'Datadog', icon: 'datadog', color: '#632CA6' },
			{ name: 'CloudWatch', icon: 'amazoncloudwatch', color: AWS },
			{ name: 'CloudWatch Logs' },
			{ name: 'Fluentd', icon: 'fluentd', color: '#0E83C8' },
		],
	},
];
