// src/ts/app.ts
//
// Runs inside the iframe (overlay.html).
// Responsibilities:
// - Receive init context + bridge token from content.ts
// - Configure http bridge token
// - Initialize shared data (catalog)
// - Mount Elm
// - Init feature modules (teams)

import { APP_VERSION } from "./infrastructure/version";
import { setBridgeToken } from "./infrastructure/http";
import { initCatalog } from "./infrastructure/catalog";
import * as teams from "./modules/teams";

// Elm compiled by esbuild-plugin-elm
import { Elm } from "../elm/Main.elm";

type InitMsg = {
	type: "adoExt:init";
	token: string;
	payload: {
		org: string;
		project: string;
		pageUrl: string;
		ext?: string;
	};
};

// Placeholder is fine, but init message token is source-of-truth in dev.
const BRIDGE_TOKEN = "__BRIDGE_TOKEN__";

type AppContext = {
	org: string;
	project: string;
	pageUrl: string;
};

function waitForInit(): Promise<{ ctx: AppContext; token: string }> {
	return new Promise((resolve) => {
		const onMsg = (event: MessageEvent) => {
			const msg = event.data as Partial<InitMsg> | undefined;
			if (!msg || msg.type !== "adoExt:init") return;

			const token = msg.token || BRIDGE_TOKEN;
			const payload = msg.payload;
			if (!token || !payload?.org || !payload?.project) return;

			window.removeEventListener("message", onMsg);
			resolve({
				token,
				ctx: {
					org: payload.org,
					project: payload.project,
					pageUrl: payload.pageUrl || "",
				},
			});
		};

		window.addEventListener("message", onMsg);
	});
}

(async function main() {
	const root = document.getElementById("root");
	if (!root) throw new Error("Missing #root in overlay.html");

	// 1) Read persisted selection BEFORE Elm mounts (so the label is right immediately)
	const initialSelectedTeamId = await teams.getStoredSelectedTeamId();

	// 2) Mount Elm (Elm owns all UI)
	const app = Elm.Main.init({
		node: root,
		flags: { initialSelectedTeamId, appVersion: APP_VERSION },
	});

	// 3) Receive init from content script (token + org/project)
	const { token, ctx } = await waitForInit();

	// 4) Configure bridge token for adoFetch() usage in infrastructure/*
	setBridgeToken(token);

	// 5) Load shared catalog cache (teams)
	await initCatalog(ctx.org, ctx.project);

	// 6) Init feature modules
	teams.init(app, ctx);

	// 7) NEW: Signalera till Elm att ports + infra är redo
	// Elm kommer då att trigga requestTeamCatalog ()
	app.ports.appReady?.send(null);
})();
