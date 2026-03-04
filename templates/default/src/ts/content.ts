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

// // src/ts/content.ts
// // Content script running on https://dev.azure.com/*
// //
// // Responsibilities:
// // - Inject a top-bar button in Azure DevOps
// // - Mount/unmount a full-page overlay with an iframe (overlay.html)
// // - Provide a simple "adoFetch" bridge for iframe/app code
// import { createAdoFetchHandler } from "./bridge";
//
// type UrlContext = {
// 	org: string;
// 	project: string;
// };
//
// // ====== Template placeholders (replace in generator) ======
// // Keep these as plain constants so it's easy to customize per generated app.
// const EXT_ID = "__EXT_ID__";                 // e.g. "my-ado-extension"
// const BUTTON_TEXT = "__BUTTON_TEXT__";       // e.g. "My ADO Extension"
// const OVERLAY_ID = "__OVERLAY_ID__";         // e.g. "adoext-overlay"
// const BUTTON_ID = "__BUTTON_ID__";           // e.g. "adoext-button"
// const BRIDGE_TOKEN = "__BRIDGE_TOKEN__";     // random-ish string to avoid collisions
//
// // Allow only ADO REST calls from the bridge.
// const ADO_OK = /^https:\/\/dev\.azure\.com\/[^/]+(?:\/[^/]+)?\/_apis\//i;
//
// let escapeHandler: ((e: KeyboardEvent) => void) | null = null;
//
// // --- Bridge: iframe -> content script fetch ---
// window.addEventListener(
// 	"message",
// 	createAdoFetchHandler({
// 		token: BRIDGE_TOKEN,
// 		allowUrl: ADO_OK,
// 	}),
// 	{ passive: true }
// );
//
// function parseUrlContext(): UrlContext | null {
// 	// https://dev.azure.com/{org}/{project}/...
// 	if (location.hostname !== "dev.azure.com") return null;
//
// 	const parts = location.pathname.replace(/^\/+/, "").split("/");
// 	const org = parts[0] || "";
// 	const project = decodeURIComponent(parts[1] || "");
//
// 	// sanity: avoid pages like /_signin or project missing
// 	if (!org || !project || project.startsWith("_")) return null;
//
// 	return { org, project };
// }
//
// // -------- Overlay mount/unmount --------
//
// function isOverlayMounted(): boolean {
// 	return Boolean(document.getElementById(OVERLAY_ID));
// }
//
// function unmountOverlay(): void {
// 	const overlay = document.getElementById(OVERLAY_ID);
// 	overlay?.remove();
//
// 	if (escapeHandler) {
// 		window.removeEventListener("keydown", escapeHandler, true);
// 		escapeHandler = null;
// 	}
//
// 	window.focus();
// }
//
// function mountOverlay(): void {
// 	if (isOverlayMounted()) return;
//
// 	const ctx = parseUrlContext();
// 	if (!ctx) return;
//
// 	const overlay = document.createElement("div");
// 	overlay.id = OVERLAY_ID;
// 	overlay.style.position = "fixed";
// 	overlay.style.inset = "0";
// 	overlay.style.zIndex = "999999";
// 	overlay.style.display = "flex";
// 	overlay.style.justifyContent = "center";
// 	overlay.style.alignItems = "center";
// 	overlay.style.background = "rgba(0,0,0,0.12)";
//
// 	const iframe = document.createElement("iframe");
// 	const base = chrome.runtime.getURL("overlay.html");
//
// 	iframe.src =
// 		`${base}?org=${encodeURIComponent(ctx.org)}&project=${encodeURIComponent(ctx.project)}&ext=${encodeURIComponent(EXT_ID)}`;
//
// 	iframe.style.width = "96%";
// 	iframe.style.height = "96%";
// 	iframe.style.border = "none";
// 	iframe.style.borderRadius = "12px";
// 	iframe.style.background = "white";
// 	iframe.style.boxShadow = "0 0 22px rgba(0,0,0,0.35)";
//
// 	overlay.appendChild(iframe);
// 	document.body.appendChild(overlay);
//
// 	iframe.addEventListener("load", () => {
// 		iframe.contentWindow?.postMessage(
// 			{ type: "adoExt:init", token: BRIDGE_TOKEN, payload: { org: ctx.org, project: ctx.project, pageUrl: location.href } },
// 			"*"
// 		);
// 	});
//
// 	// Close on click outside iframe
// 	overlay.addEventListener("click", (e) => {
// 		if (e.target === overlay) unmountOverlay();
// 	});
//
// 	// Register Escape only while overlay exists
// 	escapeHandler = (e: KeyboardEvent) => {
// 		if (e.key === "Escape") {
// 			e.preventDefault();
// 			unmountOverlay();
// 		}
// 	};
//
// 	window.addEventListener("keydown", escapeHandler, true);
// }
//
// function toggleOverlay(): void {
// 	if (isOverlayMounted()) unmountOverlay();
// 	else mountOverlay();
// }
//
// // -------- Button injection --------
//
// function findTopBar(): Element | null {
// 	// This selector has worked well historically in ADO.
// 	return document.querySelector(".region-header-menubar");
// }
//
// function buttonAlreadyInjected(): boolean {
// 	return Boolean(document.getElementById(BUTTON_ID));
// }
//
// function injectToggleButton(): void {
// 	if (buttonAlreadyInjected()) return;
//
// 	const ctx = parseUrlContext();
// 	if (!ctx) return;
//
// 	const topBar = findTopBar();
// 	if (!topBar) return;
//
// 	const button = document.createElement("button");
// 	button.id = BUTTON_ID;
// 	button.innerText = BUTTON_TEXT;
//
// 	// Use ADO-like button classes (works fine even if they change slightly)
// 	button.className = "bolt-button bolt-icon-button enabled subtle bolt-focus-treatment";
// 	button.style.marginLeft = "12px";
// 	button.style.padding = "4px 12px";
//
// 	button.addEventListener("click", () => toggleOverlay());
//
// 	topBar.appendChild(button);
// }
//
// // Best-effort injection: MutationObserver + fallback polling
// function startInjectionLoop(): void {
// 	// 1) Immediate attempt
// 	injectToggleButton();
//
// 	// 2) Observe DOM changes (SPA navigation / top bar re-render)
// 	const obs = new MutationObserver(() => {
// 		injectToggleButton();
// 	});
//
// 	obs.observe(document.documentElement, {
// 		childList: true,
// 		subtree: true,
// 	});
//
// 	// 3) Also fallback poll (cheap and robust)
// 	setInterval(() => {
// 		injectToggleButton();
// 	}, 1000);
// }
//
//
// // -------- Commands from iframe/app -> content --------
//
// window.addEventListener("message", (event) => {
// 	const msg = event.data as any;
// 	if (!msg || msg.token !== BRIDGE_TOKEN) return;
//
// 	if (msg.type === "adoExt:closeOverlay") {
// 		unmountOverlay();
// 	}
//
// 	if (msg.type === "adoExt:reloadPage") {
// 		location.reload();
// 	}
// });
//
// // -------- init --------
// startInjectionLoop();
