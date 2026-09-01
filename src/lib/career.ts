import { getCollection, type CollectionEntry } from 'astro:content';

export type CareerEntry = CollectionEntry<'career'>;

export type CareerBranch = {
	name: string;
	/** 一番新しいノードを持つブランチ。線と丸の色を変えるのに使う */
	current: boolean;
	/** 新しい順 */
	entries: CareerEntry[];
};

/**
 * 職務経歴を、ブランチごとにまとめて新しい順で返す。
 *
 * ブランチの並び順も「どれが現在進行中か」も、ファイル側には持たせず
 * 日付から導いている。frontmatter に current: true のような印を置くと、
 * 新しい案件を足したときに前の印を消し忘れて2つ現在地ができる。
 */
export async function getCareerBranches(): Promise<CareerBranch[]> {
	const entries = await getCollection('career');

	// from は YYYY.MM で桁が揃っているので、文字列のまま比較できる
	entries.sort((a, b) => {
		if (a.data.from !== b.data.from) return b.data.from.localeCompare(a.data.from);
		// 同じ月に節目と案件が並ぶときは、節目を古い側（＝後ろ）に置く
		const rank = (entry: CareerEntry) => (entry.data.kind === 'milestone' ? 1 : 0);
		return rank(a) - rank(b);
	});

	const order: string[] = [];
	const grouped = new Map<string, CareerEntry[]>();
	for (const entry of entries) {
		const name = entry.data.branch;
		if (!grouped.has(name)) {
			grouped.set(name, []);
			order.push(name);
		}
		grouped.get(name)?.push(entry);
	}

	// 並べ替え済みなので、最初に現れたブランチが最新のノードを持つ
	return order.map((name, i) => ({
		name,
		current: i === 0,
		entries: grouped.get(name) ?? [],
	}));
}
