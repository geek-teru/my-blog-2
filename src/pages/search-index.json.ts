import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../lib/posts';

/**
 * 検索用のインデックス。静的ビルドなので /search-index.json という
 * ただのファイルとして書き出され、検索ページがそれを読んで絞り込む。
 *
 * 本文も入れているのは、タイトルと説明だけだと「あの記事のあのコマンド」を
 * 探せないため。全文だと記事が増えたときに重くなるので、1記事あたりで打ち切る。
 */
const MAX_BODY_CHARS = 4000;

/** Markdown の記号を落として、検索に効く素のテキストにする */
function toPlainText(markdown: string): string {
	return markdown
		.replace(/```[\s\S]*?```/g, ' ') // コードブロックは丸ごと落とす
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^[>\-*+]\s+/gm, '')
		.replace(/[*_~|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export const GET: APIRoute = async () => {
	const posts = await getPublishedPosts();

	const index = posts.map((post) => ({
		id: post.id,
		title: post.data.title,
		description: post.data.description ?? '',
		tags: post.data.tags,
		pubDate: post.data.pubDate.toISOString(),
		text: toPlainText(post.body ?? '').slice(0, MAX_BODY_CHARS),
	}));

	return new Response(JSON.stringify(index), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
