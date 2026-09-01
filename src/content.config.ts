import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// 記事はプロジェクトルート直下の `content/blog/` に置く。src/ の外に出しているのは、
	// ここを後で別リポジトリ（記事リポジトリ）のマウント先にするため（docs/blog-spec.md 4節）。
	loader: glob({ base: './content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			// 移行元の md には無いので任意。取り込み時に本文の冒頭から自動生成している
			description: z.string().optional(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			tags: z.array(z.string()).default([]),
			// true なら本番ビルドから除外する（フィルタの実装は Phase 3）
			draft: z.boolean().default(false),
			heroImage: z.optional(image()),
		}),
});

/**
 * 職務経歴。案件と節目を1ファイル1ノードとして持つ。
 *
 * 構造（どのブランチか / 期間 / 概要）は frontmatter に、業務詳細は本文に置く。
 * 本文の見出しから構造を読み取る作りにすると、書き方が少し揺れただけで
 * グラフが崩れる。型で保証できるものは frontmatter に寄せている。
 */
const career = defineCollection({
	loader: glob({ base: './content/career', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		/** 同じブランチに属するものが1本の線に並ぶ */
		branch: z.string(),
		/** YYYY.MM。文字列のまま比較して並べ替えるので桁を揃えること */
		from: z.string().regex(/^\d{4}\.\d{2}$/),
		/** 節目には終わりが無いので任意 */
		to: z.string().regex(/^\d{4}\.\d{2}$/).optional(),
		kind: z.enum(['project', 'milestone']).default('project'),
		summary: z.array(z.string()).default([]),
	}),
});

export const collections = { blog, career };
