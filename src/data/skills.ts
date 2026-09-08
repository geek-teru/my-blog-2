/**
 * Profile ページのスキル一覧。
 *
 * コンテンツコレクションにしていないのは、スキルが本文を持たず、並び順そのものが
 * 意味を持つため（詳細は docs/profile-page-spec.md）。
 *
 * `icon` は Simple Icons のスラッグ。**省略するとテキストだけのチップになる。**
 * Simple Icons に無いもの（Java、WSL など）は無理にそれらしいロゴを当てず、
 * 省略してテキストで出す。
 */
export type Skill = {
	/** チップに出す表示名 */
	name: string;
	/** Simple Icons のスラッグ。無ければ省略する */
	icon?: string;
};

export type SkillGroup = {
	title: string;
	items: Skill[];
};

/** 実務の中心が上に来るよう、インフラ系から並べる */
export const skillGroups: SkillGroup[] = [
	{
		title: 'クラウド / インフラ',
		items: [
			{ name: 'AWS', icon: 'amazonwebservices' },
			{ name: 'Google Cloud', icon: 'googlecloud' },
			{ name: 'vSphere', icon: 'vmware' },
			{ name: 'Nginx', icon: 'nginx' },
			{ name: 'Apache', icon: 'apache' },
		],
	},
	{
		title: 'IaC / CI/CD',
		items: [
			{ name: 'Terraform', icon: 'terraform' },
			{ name: 'Ansible', icon: 'ansible' },
			{ name: 'GitHub Actions', icon: 'githubactions' },
			{ name: 'Jenkins', icon: 'jenkins' },
		],
	},
	{
		title: '監視 / 運用',
		items: [
			{ name: 'Datadog', icon: 'datadog' },
			{ name: 'Fluentd', icon: 'fluentd' },
			{ name: 'CloudWatch', icon: 'amazoncloudwatch' },
		],
	},
	{
		title: 'バックエンド / DB',
		items: [
			// Simple Icons に Java のロゴは無い
			{ name: 'Java' },
			{ name: 'Ruby', icon: 'ruby' },
			{ name: 'PostgreSQL', icon: 'postgresql' },
			{ name: 'Supabase', icon: 'supabase' },
		],
	},
	{
		title: 'フロントエンド',
		items: [
			{ name: 'Next.js', icon: 'nextdotjs' },
			{ name: 'React', icon: 'react' },
			{ name: 'TypeScript', icon: 'typescript' },
		],
	},
	{
		title: 'ツール',
		items: [
			{ name: 'Git', icon: 'git' },
			{ name: 'GitHub', icon: 'github' },
			{ name: 'Docker', icon: 'docker' },
			// WSL 単体のロゴは Simple Icons に無い
			{ name: 'WSL' },
			{ name: 'Slack', icon: 'slack' },
		],
	},
];
