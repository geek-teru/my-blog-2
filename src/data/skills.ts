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
 * `color` は省略すると本文色を継ぐ。**推測した hex は書かない。**
 * 入れてあるのは公式の simple-icons パッケージで照合できた値だけ。
 *
 * AWS 系・Azure・Oracle は最新版から削除されているので、収録のあった v11 から引いた。
 * AWS のサービス色はカテゴリごとに決まっていて、v11 の値がそれを反映している
 * （Compute 系がオレンジ、Networking 系が紫、Security 系が赤、など）。
 *
 * Ansible と Jenkins だけは公式色を外して黒にしている。赤系が主張しすぎるため。
 * 外している行にはコメントで公式色を併記した。
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

export const skillGroups: SkillGroup[] = [
	{
		title: 'Infrastructure',
		items: [
			{ name: 'AWS', icon: 'amazonwebservices', color: '#232F3E' },
			{ name: 'Azure', icon: 'microsoftazure', color: '#0078D4' },
			{ name: 'Google Cloud', icon: 'googlecloud', color: '#4285F4' },
			{ name: 'vSphere', icon: 'vmware', color: '#607078' },
			{ name: 'Terraform', icon: 'terraform', color: '#844FBA' },
			{ name: 'Ansible', icon: 'ansible', color: '#000000' }, // 公式は #EE0000
			{ name: 'VPC' },
			{ name: 'Route 53', icon: 'amazonroute53', color: '#8C4FFF' },
			{ name: 'ALB', icon: 'awselasticloadbalancing', color: '#8C4FFF' },
			{ name: 'ECS', icon: 'amazonecs', color: '#FF9900' },
			{ name: 'Lambda', icon: 'awslambda', color: '#FF9900' },
			{ name: 'AWS Batch' },
			{ name: 'API Gateway', icon: 'amazonapigateway', color: '#FF4F8B' },
			{ name: 'Amplify', icon: 'awsamplify', color: '#FF9900' },
			{ name: 'Step Functions' },
		],
	},
	{
		title: 'Security',
		items: [
			{ name: 'IAM', icon: 'amazoniam', color: '#DD344C' },
			{ name: 'CloudTrail' },
			{ name: 'Config' },
			{ name: 'AWS WAF' },
			{ name: 'Network Firewall' },
			{ name: 'Cognito', icon: 'amazoncognito', color: '#DD344C' },
		],
	},
	{
		title: 'Database / Data Platform',
		items: [
			{ name: 'MySQL', icon: 'mysql', color: '#4479A1' },
			{ name: 'PostgreSQL', icon: 'postgresql', color: '#4169E1' },
			{ name: 'Oracle', icon: 'oracle', color: '#F80000' },
			{ name: 'RDS', icon: 'amazonrds', color: '#527FFF' },
			{ name: 'Redshift', icon: 'amazonredshift', color: '#8C4FFF' },
			{ name: 'S3', icon: 'amazons3', color: '#569A31' },
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
			{ name: 'CloudWatch', icon: 'amazoncloudwatch', color: '#FF4F8B' },
			{ name: 'CloudWatch Logs' },
			{ name: 'Fluentd', icon: 'fluentd', color: '#0E83C8' },
		],
	},
];
