import { fetchWorkItemsBatch } from "./fetch";

export const MAX_BATCH = 200;
export function chunk<T>(arr: T[], size = MAX_BATCH): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}




export async function fetchParentItemsMap(org: string, rows: any[]): Promise<Map<number, any>> {
	const parentIds = new Set<number>();

	for (const row of rows) {
		const f = row.fields ?? {};
		const parentId = f["System.Parent"];
		if (typeof parentId === "number") {
			parentIds.add(parentId);
		}
	}

	// No parents? Just return an empty map.
	if (parentIds.size === 0) {
		return new Map();
	}

	const parentIdList = Array.from(parentIds);

	// Reuse your existing batch fetch
	const parentRows = await fetchWorkItemsBatch(org, parentIdList);

	const parentsById = new Map<number, any>();
	for (const p of parentRows) {
		if (typeof p.id === "number") {
			parentsById.set(p.id, p);
		}
	}

	return parentsById;
}

