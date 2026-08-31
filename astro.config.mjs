// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// my-blog-2.vercel.app は別のユーザーに取られており、まったく無関係のサイトが出る。
	// canonical / RSS / sitemap / OGP がすべてそこを指してしまうので絶対に使わないこと。
	// Vercel がこのプロジェクトに割り当てたのはチーム名込みのこちら。
	site: 'https://my-blog-2-terus-projects-8b7c1ca7.vercel.app',
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
