// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Teru's Home";
export const SITE_DESCRIPTION = '手を動かして学んだことを、そのまま記事にしていくブログ。';

/** Profile ページのアバターに出す頭文字 */
export const PROFILE_MONOGRAM = 'T';

/**
 * Profile ページに出す外部リンク。アイコンだけで並べるので、
 * `label` は読み上げとツールチップ用（画面には出ない）。
 * `icon` は Simple Icons のスラッグ。
 */
export const SOCIAL_LINKS = [
	{ label: 'GitHub', icon: 'github', href: 'https://github.com/geek-teru' },
	// TODO: 実際のユーザー名に差し替える
	{ label: 'X', icon: 'x', href: 'https://x.com/' },
];
