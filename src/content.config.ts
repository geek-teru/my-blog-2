import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// 記事はプロジェクトルート直下の `content/blog/` に置く。src/ の外に出しているのは、
	// ここを後で別リポジトリ（記事リポジトリ）のマウント先にするため（blog-spec.md 4節）。
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

export const collections = { blog };
