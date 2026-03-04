// src/ts/modules/teams/index.ts
import { listTeams } from "../../infrastructure/catalog";
import { fetchFavoriteBoards } from "../../infrastructure/fetch";

export type UrlContext = {
	org: string;
	project: string;
	pageUrl: string;
};

function isChromeStorageAvailable(): boolean {
	return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

export function getStoredSelectedTeamId(): Promise<string | null> {
	if (!isChromeStorageAvailable()) return Promise.resolve(null);

	return new Promise((resolve) => {
		chrome.storage.local.get(["selectedTeamId"], (res) => {
			resolve(typeof res.selectedTeamId === "string" ? res.selectedTeamId : null);
		});
	});
}

export function storeSelectedTeamId(id: string): Promise<void> {
	if (!isChromeStorageAvailable()) return Promise.resolve();

	return new Promise((resolve) => {
		chrome.storage.local.set({ selectedTeamId: id }, () => resolve());
	});
}

/**
 * Wire ports for the "teams" feature.
 *
 * Pull model:
 * - Elm asks for catalog via `requestTeamCatalog`
 * - TS answers via `receiveTeamCatalog` with { teams, favorites }
 * - Elm notifies selection via `selectedTeamChanged`, TS stores it
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function init(app: any, ctx: UrlContext) {
	if (!app?.ports) {
		console.warn("[teams] Missing app.ports");
		return;
	}

	// Elm -> TS : request teams/favorites
	app.ports.requestTeamCatalog?.subscribe(async () => {
		try {
			const teams = listTeams(); // [{id,name}, ...]
			const favorites = await fetchFavoriteBoards(ctx.org); // should be list of team names

			app.ports.receiveTeamCatalog?.send({ teams, favorites });
		} catch (e: any) {
			console.warn("[teams] failed to load team catalog:", e?.message || e);
			// Fail soft: send empty so Elm can still render
			app.ports.receiveTeamCatalog?.send({ teams: [], favorites: [] });
		}
	});

	// Elm -> TS : selection changed
	app.ports.selectedTeamChanged?.subscribe(async (teamId: unknown) => {
		if (typeof teamId !== "string" || !teamId) return;
		await storeSelectedTeamId(teamId);
	});
}
