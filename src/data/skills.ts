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
	/** ブランドカラー。省略すると本文色を継ぐ */
	color?: string;
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
			{ name: 'AWS', icon: 'amazonwebservices', color: '#FF9900' },
			{ name: 'Google Cloud', icon: 'googlecloud', color: '#4285F4' },
			{ name: 'vSphere', icon: 'vmware', color: '#607078' },
			{ name: 'Nginx', icon: 'nginx', color: '#009639' },
			{ name: 'Apache', icon: 'apache', color: '#D22128' },
		],
	},
	{
		title: 'IaC / CI/CD',
		items: [
			{ name: 'Terraform', icon: 'terraform', color: '#844FBA' },
			{ name: 'Ansible', icon: 'ansible', color: '#EE0000' },
			{ name: 'GitHub Actions', icon: 'githubactions', color: '#2088FF' },
			{ name: 'Jenkins', icon: 'jenkins', color: '#D24939' },
		],
	},
	{
		title: '監視 / 運用',
		items: [
			{ name: 'Datadog', icon: 'datadog', color: '#632CA6' },
			{ name: 'Fluentd', icon: 'fluentd', color: '#0E83C8' },
			{ name: 'CloudWatch', icon: 'amazoncloudwatch', color: '#FF4F8B' },
		],
	},
	{
		title: 'バックエンド / DB',
		items: [
			// Simple Icons に Java のロゴは無い
			{ name: 'Java' },
			{ name: 'Ruby', icon: 'ruby', color: '#CC342D' },
			{ name: 'PostgreSQL', icon: 'postgresql', color: '#4169E1' },
			{ name: 'Supabase', icon: 'supabase', color: '#3FCF8E' },
		],
	},
	{
		title: 'フロントエンド',
		items: [
			{ name: 'Next.js', icon: 'nextdotjs', color: '#000000' },
			{ name: 'React', icon: 'react', color: '#61DAFB' },
			{ name: 'TypeScript', icon: 'typescript', color: '#3178C6' },
		],
	},
	{
		title: 'ツール',
		items: [
			{ name: 'Git', icon: 'git', color: '#F03C2E' },
			{ name: 'GitHub', icon: 'github', color: '#181717' },
			{ name: 'Docker', icon: 'docker', color: '#2496ED' },
			// WSL 単体のロゴは Simple Icons に無い
			{ name: 'WSL' },
			{ name: 'Slack', icon: 'slack', color: '#4A154B' },
		],
	},
];
