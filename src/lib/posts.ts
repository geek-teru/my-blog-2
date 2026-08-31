import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * 公開する記事を、新しい順に返す。
 *
 * `draft: true` の記事は本番ビルドでのみ落とす。開発中は書きかけを画面で
 * 確認したいので `astro dev` では出す（`import.meta.env.PROD` が false）。
 *
 * 一覧ページ・記事ページの getStaticPaths・RSS の3か所すべてがこの関数を通ること。
 * 同じ条件を各所に書くと、いずれ必ずどれかで書き忘れて本番に下書きが漏れる。
 * 記事の集合を得る入口をここ1本に絞るのが、この関数の唯一の目的。
 */
export async function getPublishedPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) => !(import.meta.env.PROD && data.draft));
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
