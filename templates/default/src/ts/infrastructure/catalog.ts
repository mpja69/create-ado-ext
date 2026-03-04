import { fetchProjectId, fetchProjectTeams } from "./fetch";

export type ProjectTeam = {
	id: string;
	name: string;
};

export type CatalogContext = {
	org: string;
	projectName: string;
	projectId: string;
};

// Internal cache
let ctx: CatalogContext | null = null;
let teams: ProjectTeam[] = [];
let teamsById: Map<string, ProjectTeam> = new Map();

export async function initCatalog(org: string, projectName: string): Promise<void> {
	const projectId = await fetchProjectId(org, projectName);
	const list = await fetchProjectTeams(org, projectId);

	ctx = { org, projectName, projectId };
	teams = list;
	teamsById = new Map(list.map(t => [t.id, t]));
}

export function getContext(): CatalogContext | null {
	return ctx;
}

export function listTeams(): ProjectTeam[] {
	return teams.slice();
}

export function getTeamById(id: string): ProjectTeam | undefined {
	return teamsById.get(id);
}
