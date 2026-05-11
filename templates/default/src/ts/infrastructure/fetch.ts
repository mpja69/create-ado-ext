// src/ts/infrastructure/fetch.ts
import { adoFetch, safeJson, SessionExpiredError, type BridgeRes } from "./http";
import { Iteration, BoardColumn, ProjectTeam, TeamConfig } from "./types"

// ---- Favorites ----
type Favorite = { artifactName: string };
type FavoriteRes = { value: Favorite[] };

export async function fetchFavoriteBoards(org: string): Promise<string[]> {
	const url =
		`https://dev.azure.com/${encodeURIComponent(org)}` +
		`/_apis/favorite/favorites?artifactType=Microsoft.TeamFoundation.Work.TeamBoardSets&api-version=7.1-preview.1`;

	const res = await adoFetch(url, { method: "GET" });

	let json: FavoriteRes;
	try {
		json = await safeJson<FavoriteRes>(res, "favorites");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		throw new Error("Failed to fetch favorites");
	}

	return (json.value ?? []).map((fav) => fav.artifactName);
}

// ---- Iterations ----
type IterationRes = {
	value?: Array<{
		name: string;
		path: string;
		attributes?: { startDate?: string; finishDate?: string };
	}>;
};

export async function fetchTeamIterations(org: string, projectId: string, teamId: string): Promise<Iteration[]> {
	const url =
		`https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(projectId)}/${encodeURIComponent(teamId)}` +
		`/_apis/work/teamsettings/iterations?api-version=7.0`;

	const res = await adoFetch(url, { method: "GET" });

	let json: IterationRes;
	try {
		json = await safeJson<IterationRes>(res, "iterations");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		return [];
	}

	const data: Iteration[] = (json.value ?? []).map((it) => ({
		name: it.name,
		path: it.path,
		startDate: (it.attributes?.startDate ?? "").slice(0, 10),
		finishDate: (it.attributes?.finishDate ?? "").slice(0, 10),
	}));

	data.sort((a, b) => a.finishDate.localeCompare(b.finishDate));
	return data;
}

// ---- Columns (boards -> columns) ----
export async function fetchKanbanColumnsWithStates(
	org: string,
	projectId: string,
	teamId: string,
	workItemType: string
): Promise<BoardColumn[]> {
	const boardsUrl =
		`https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(projectId)}/${encodeURIComponent(teamId)}` +
		`/_apis/work/boards?api-version=7.0`;

	const boardsRes = await adoFetch(boardsUrl, { method: "GET" });

	let boardsJson: { value?: any[] };
	try {
		boardsJson = await safeJson(boardsRes, "boards");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		return [];
	}

	const boards: any[] = boardsJson.value ?? [];
	const boardNameGuess = workItemType.endsWith("y") ? workItemType.slice(0, -1) + "ies" : workItemType + "s";
	const board = boards.find((b) => b.name === boardNameGuess) ?? boards[0];

	if (!board) return [];

	const colsUrl =
		`https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(projectId)}/${encodeURIComponent(teamId)}` +
		`/_apis/work/boards/${encodeURIComponent(board.id)}/columns?api-version=7.0`;

	const colsRes = await adoFetch(colsUrl, { method: "GET" });

	let colsJson: { value?: any[]; columns?: any[] } = {};
	try {
		colsJson = await safeJson(colsRes, "columns");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		return [];
	}

	const cols: any[] = colsJson.value ?? colsJson.columns ?? [];
	return cols.map((c: any) => ({
		name: String(c.name),
		mappedState: String(c.stateMappings?.[workItemType] ?? c.stateMappings?.["*"] ?? "").trim(),
	}));
}

// ---- Revisions (paging via $top/$skip) ----
export async function fetchAllRevisions(org: string, projectId: string, id: number): Promise<any[]> {
	const PAGE = 200;
	const base =
		`https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(projectId)}` +
		`/_apis/wit/workItems/${id}/revisions?api-version=7.1&$expand=fields`;

	const out: any[] = [];

	for (let skip = 0; ; skip += PAGE) {
		const url = `${base}&$top=${PAGE}&$skip=${skip}`;
		const resp = await adoFetch(url, { method: "GET" });
		const json = await safeJson<{ value?: any[] }>(resp, "revisions");
		const chunk = json.value ?? [];
		out.push(...chunk);
		if (chunk.length < PAGE) break;
	}

	return out;
}

// ---- Team config (area path defaults) ----
export async function fetchTeamConfig(org: string, projectId: string, teamId: string): Promise<TeamConfig> {
	const url =
		`https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(projectId)}/${encodeURIComponent(teamId)}` +
		`/_apis/work/teamsettings/teamfieldvalues?api-version=7.1`;

	const res = await adoFetch(url, { method: "GET" });
	const json = await safeJson<any>(res, "teamfieldvalues");

	const defaultAreaPath = String(json?.defaultValue || "");
	const values: Array<{ value: string; includeChildren: boolean }> = (json?.values ?? []).map((v: any) => ({
		value: String(v?.value || ""),
		includeChildren: !!v?.includeChildren,
	}));

	const defaultEntry = values.find((v) => v.value === defaultAreaPath);
	const includeChildrenDefault = defaultEntry?.includeChildren ?? false;

	return { defaultAreaPath, includeChildrenDefault };
}

// ---- Project id (project name -> id) ----
export async function fetchProjectId(org: string, projectName: string): Promise<string> {
	const url =
		`https://dev.azure.com/${encodeURIComponent(org)}/_apis/projects/${encodeURIComponent(projectName)}?api-version=7.1`;

	const res = await adoFetch(url, { method: "GET" });
	const json = await safeJson<{ id?: string }>(res, "project");

	if (!json.id) throw new Error("project-not-found");
	return json.id;
}

// ---- Teams in project (paging via continuationToken) ----
function readContinuation(res: BridgeRes): string | null {
	return res.cont ? res.cont : null;
}

export async function fetchProjectTeams(org: string, projectId: string): Promise<ProjectTeam[]> {
	const base =
		`https://dev.azure.com/${encodeURIComponent(org)}` +
		`/_apis/projects/${encodeURIComponent(projectId)}/teams?api-version=7.1&$top=200`;

	const out: ProjectTeam[] = [];
	let url: string | null = base;
	let guard = 0;

	while (url && guard++ < 50) {
		const res = await adoFetch(url, { method: "GET" });
		const json = await safeJson<{ value?: any[] }>(res, "teams");

		const chunk = (json.value ?? []).map((t) => ({ id: String(t.id), name: String(t.name) }));
		out.push(...chunk);

		const token = readContinuation(res);
		url = token ? `${base}&continuationToken=${encodeURIComponent(token)}` : null;
	}

	return out;
}

export async function runWiqlQuery(query: string, org: string, projectId: string): Promise<number[]> {

	const wiql = { query: query };
	const url = `https://dev.azure.com/${org}/${encodeURIComponent(projectId)}/_apis/wit/wiql?api-version=7.1`;
	const res = await adoFetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(wiql),
	});

	let data: { workItems?: Array<{ id: number }> };
	try {
		data = await safeJson<typeof data>(res, "wiql");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		throw new Error("[WIQL] request failed");
	}

	return (data.workItems ?? []).map((x) => x.id);
}
// Example custom fields:
// [
// 	"System.Id",
// 	"System.Title",
// 	"System.State",
// 	"System.Tags",
// 	"System.BoardColumn",
// 	"Microsoft.VSTS.Common.ActivatedDate",
// 	"Microsoft.VSTS.Common.ClosedDate",
// 	"System.Parent",
// ]
export async function fetchWorkItemsBatch(
	org: string,
	ids: number[],
	fields?: string[]
): Promise<any[]> {

	if (ids.length === 0) return [];

	const body: any = { ids };

	if (fields && fields.length > 0) {
		body.fields = fields;
	}

	const url = `https://dev.azure.com/${org}/_apis/wit/workitemsbatch?api-version=7.1`;

	const res = await adoFetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	let data: { value?: any[] };
	try {
		data = await safeJson<typeof data>(res, "workitemsbatch");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		throw new Error("[workitemsbatch] request failed");
	}

	return data.value ?? [];
}


export async function fetchWorkItem(org: string, id: number, fields?: string[]): Promise<any | null> {

	const fieldsParam =
		fields && fields.length > 0
			? `&fields=${encodeURIComponent(fields.join(","))}`
			: "";

	const url =
		`https://dev.azure.com/${org}/_apis/wit/workitems/${id}?api-version=7.1${fieldsParam}`;

	const res = await adoFetch(url, {
		method: "GET",
	});

	let data: any;
	try {
		data = await safeJson<any>(res, "workitem");
	} catch (err) {
		if (err instanceof SessionExpiredError) throw err;
		throw new Error("[workitem] request failed");
	}

	return data ?? null;
}
