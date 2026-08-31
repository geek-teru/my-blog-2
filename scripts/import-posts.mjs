/**
 * ws/blog の素の Markdown を、Astro のコンテンツコレクションが読める形に正規化して取り込む。
 *
 * 移行元の md には frontmatter が無く、タイトルの持ち方も日付の有無もバラバラなため、
 * ここで実ファイルに frontmatter を書き込んでしまう。カスタムローダーで吸収しないのは、
 * Keystatic が frontmatter のフィールドを前提に編集 UI を組み立てるため（blog-spec.md 5節）。
 *
 * 使い方:
 *   node scripts/import-posts.mjs                        # 全 .md を取り込む
 *   node scripts/import-posts.mjs <file.md> [<file.md>]  # ファイルを指定して取り込む
 *   node scripts/import-posts.mjs --force                # 既存の出力を上書きする
 *   node scripts/import-posts.mjs --src=../blog          # 移行元を変える
 */

import { readdir, readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'content', 'blog');

const args = process.argv.slice(2);
const force = args.includes('--force');
const srcArg = args.find((a) => a.startsWith('--src='));
const SRC = path.resolve(ROOT, srcArg ? srcArg.slice('--src='.length) : '../blog');
const targets = args.filter((a) => !a.startsWith('--'));

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-/;

/** ファイル名から日付プレフィックスを落としたものをスラッグにする（URL が短くて済む） */
const toSlug = (filename) => path.basename(filename, '.md').replace(DATE_PREFIX, '');

/** YYYY-MM-DD 形式。ローカル時刻で切る（UTC に寄せると日付が1日ずれる） */
const toISODate = (d) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** YAML のダブルクォート文字列として安全にする */
const yamlString = (s) => JSON.stringify(s);

/**
 * タイトルは「最初の H1、無ければ最初の非空行」から拾い、その行は本文から取り除く。
 * レイアウト側が h1 を出すため、残すとタイトルが二重に表示される。
 */
function extractTitle(lines) {
	const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
	if (h1 !== -1) {
		return { title: lines[h1].replace(/^#\s+/, '').trim(), index: h1 };
	}
	const first = lines.findIndex((l) => l.trim() !== '');
	if (first === -1) return { title: null, index: -1 };
	return { title: lines[first].trim(), index: first };
}

/** 最初の「普通の段落」から 100 字程度の説明文を作る。見出し・引用・箇条書き・コードは飛ばす */
function extractDescription(lines) {
	let inFence = false;
	for (const raw of lines) {
		const line = raw.trim();
		if (/^(```|~~~)/.test(line)) {
			inFence = !inFence;
			continue;
		}
		if (inFence || line === '') continue;
		if (/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|\||---$)/.test(line)) continue;

		const plain = line
			.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
			.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
			.replace(/[`*_]/g, '')
			.trim();
		if (plain === '') continue;
		return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
	}
	return null;
}

/** 記事間の相対 md リンク ./xxx.md を /blog/<slug>/ に張り替える */
function rewriteRelativeLinks(body) {
	const rewritten = [];
	const out = body.replace(
		/\]\((\.{1,2}\/)?([^)\s]+?)\.md(#[^)\s]*)?\)/g,
		(_match, _dot, name, hash = '') => {
			const slug = toSlug(`${name}.md`);
			rewritten.push(slug);
			return `](/blog/${slug}/${hash})`;
		},
	);
	return { out, rewritten };
}

async function main() {
	if (!existsSync(SRC)) {
		console.error(`移行元が見つかりません: ${SRC}`);
		process.exit(1);
	}
	await mkdir(DEST, { recursive: true });

	// .md のみ対象。手で HTML 化した産物（.html）は取り込まない
	const all = (await readdir(SRC)).filter((f) => f.endsWith('.md'));
	const files = targets.length > 0 ? targets.map((t) => path.basename(t)) : all;

	let written = 0;
	for (const file of files) {
		const srcPath = path.join(SRC, file);
		if (!existsSync(srcPath)) {
			console.warn(`  skip  ${file} — 移行元に存在しません`);
			continue;
		}

		const slug = toSlug(file);
		const destPath = path.join(DEST, `${slug}.md`);
		if (existsSync(destPath) && !force) {
			console.log(`  skip  ${file} — 出力先に既にあります（上書きするなら --force）`);
			continue;
		}

		const raw = await readFile(srcPath, 'utf8');

		// すでに frontmatter があるものは素通しする（何度流しても壊れないように）
		if (raw.startsWith('---\n') || raw.startsWith('---\r\n')) {
			await writeFile(destPath, raw, 'utf8');
			console.log(`  pass  ${file} — frontmatter があるのでそのままコピー`);
			written++;
			continue;
		}

		const lines = raw.split(/\r?\n/);
		const { title, index } = extractTitle(lines);
		if (!title) {
			console.warn(`  skip  ${file} — 中身が空です`);
			continue;
		}

		const rest = lines.slice(index + 1);
		while (rest.length > 0 && rest[0].trim() === '') rest.shift();

		const description = extractDescription(rest);

		// 日付はファイル名の YYYY-MM-DD- から。無ければ mtime にフォールバック
		const matched = file.match(DATE_PREFIX);
		const pubDate = matched ? matched[1] : toISODate((await stat(srcPath)).mtime);
		if (!matched) {
			console.warn(`  note  ${file} — ファイル名に日付が無いので mtime (${pubDate}) を使いました`);
		}

		const { out: body, rewritten } = rewriteRelativeLinks(rest.join('\n').trimEnd());
		for (const to of rewritten) {
			console.log(`  link  ${file} — 相対リンクを /blog/${to}/ に張り替えました`);
		}

		const frontmatter = [
			'---',
			`title: ${yamlString(title)}`,
			...(description ? [`description: ${yamlString(description)}`] : []),
			`pubDate: ${pubDate}`,
			'tags: []',
			'draft: false',
			'---',
			'',
		].join('\n');

		await writeFile(destPath, `${frontmatter}${body}\n`, 'utf8');
		console.log(`  write ${file} -> content/blog/${slug}.md`);
		written++;
	}

	console.log(`\n${written} 件を取り込みました（移行元: ${SRC}）`);
}

main();
