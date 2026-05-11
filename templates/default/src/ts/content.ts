// src/ts/content.ts
// Content script running on https://dev.azure.com/*
//
// Responsibilities:
// - Inject a top-bar button in Azure DevOps
// - Setup adoFetch bridge handler (iframe -> content fetch w/ credentials)
// - React to commands from iframe (close/reload)

import { createAdoFetchHandler } from "./infrastructure/bridge";
import { getUrlContext, toggleOverlay, closeOverlay } from "./infrastructure/mount";

// ====== Template placeholders (replace in generator) ======
const BUTTON_TEXT = "__BUTTON_TEXT__";   // e.g. "My ADO Extension"
const BUTTON_ID = "__BUTTON_ID__";       // e.g. "adoext-button"
const BRIDGE_TOKEN = "__BRIDGE_TOKEN__"; // must match mount.ts/app.ts

// Allow only ADO REST calls from the bridge.
const ADO_OK = /^https:\/\/dev\.azure\.com\/[^/]+(?:\/[^/]+)?\/_apis\//i;

// --- Bridge: iframe -> content script fetch ---
window.addEventListener(
	"message",
	createAdoFetchHandler({
		token: BRIDGE_TOKEN,
		allowUrl: ADO_OK,
	}),
	{ passive: true }
);

// -------- Button injection --------

function findTopBar(): Element | null {
	return document.querySelector(".region-header-menubar");
}

function buttonAlreadyInjected(): boolean {
	return Boolean(document.getElementById(BUTTON_ID));
}

function injectToggleButton(): void {
	if (buttonAlreadyInjected()) return;

	// only inject on “real” org/project pages
	if (!getUrlContext()) return;

	const topBar = findTopBar();
	if (!topBar) return;

	const button = document.createElement("button");
	button.id = BUTTON_ID;
	button.innerText = BUTTON_TEXT;

	// ADO-like styling
	button.className = "bolt-button bolt-icon-button enabled subtle bolt-focus-treatment";
	button.style.marginLeft = "12px";
	button.style.padding = "4px 12px";

	button.addEventListener("click", () => toggleOverlay());

	topBar.appendChild(button);
}

// Best-effort injection: MutationObserver + fallback polling
function startInjectionLoop(): void {
	// 1) immediate attempt
	injectToggleButton();

	// 2) observe DOM changes (SPA navigation / top bar re-render)
	const obs = new MutationObserver(() => {
		injectToggleButton();
	});
	obs.observe(document.documentElement, { childList: true, subtree: true });

	// 3) fallback poll
	setInterval(() => {
		injectToggleButton();
	}, 1000);
}

// -------- Commands from iframe/app -> content --------

window.addEventListener("message", (event) => {
	const msg = event.data as any;
	if (!msg || msg.token !== BRIDGE_TOKEN) return;

	if (msg.type === "adoExt:closeOverlay") {
		closeOverlay();
		return;
	}

	if (msg.type === "adoExt:reloadPage") {
		location.reload();
		return;
	}
});

// -------- init --------
startInjectionLoop();
