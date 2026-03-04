// src/ts/mount.ts
//
// Content-script side overlay lifecycle (DOM only).
// - Creates/removes the full-screen overlay + iframe
// - Closes on Escape (only while mounted)
// - Closes when clicking outside iframe (on the backdrop)

type UrlContext = {
	org: string;
	project: string;
};

// ====== Template placeholders (replace in generator) ======
const EXT_ID = "__EXT_ID__";             // e.g. "my-ado-extension"
const OVERLAY_ID = "__OVERLAY_ID__";     // e.g. "adoext-overlay"
const BRIDGE_TOKEN = "__BRIDGE_TOKEN__"; // random-ish string to avoid collisions

let escapeHandler: ((e: KeyboardEvent) => void) | null = null;

export function getUrlContext(): UrlContext | null {
	// https://dev.azure.com/{org}/{project}/...
	if (location.hostname !== "dev.azure.com") return null;

	const parts = location.pathname.replace(/^\/+/, "").split("/");
	const org = parts[0] || "";
	const project = decodeURIComponent(parts[1] || "");

	// sanity: avoid pages like /_signin or project missing
	if (!org || !project || project.startsWith("_")) return null;

	return { org, project };
}

export function isOverlayMounted(): boolean {
	return Boolean(document.getElementById(OVERLAY_ID));
}

export function closeOverlay(): void {
	const overlay = document.getElementById(OVERLAY_ID);
	overlay?.remove();

	if (escapeHandler) {
		window.removeEventListener("keydown", escapeHandler, true);
		escapeHandler = null;
	}

	// give focus back to page
	window.focus();
}

export function openOverlay(): void {
	if (isOverlayMounted()) return;

	const ctx = getUrlContext();
	if (!ctx) return;

	// Backdrop / mask
	const overlay = document.createElement("div");
	overlay.id = OVERLAY_ID;
	Object.assign(overlay.style, {
		position: "fixed",
		inset: "0",
		zIndex: "999999", // ADO has many layers
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		background: "rgba(0,0,0,0.12)",
	});

	// Iframe for the extension app
	const iframe = document.createElement("iframe");
	const base = chrome.runtime.getURL("overlay.html");
	iframe.src =
		`${base}?org=${encodeURIComponent(ctx.org)}&project=${encodeURIComponent(ctx.project)}&ext=${encodeURIComponent(EXT_ID)}`;

	Object.assign(iframe.style, {
		width: "96%",
		height: "96%",
		border: "none",
		borderRadius: "12px",
		background: "white",
		boxShadow: "0 0 22px rgba(0,0,0,0.35)",
	});

	overlay.appendChild(iframe);
	document.body.appendChild(overlay);

	// Notify iframe when ready (token + context)
	iframe.addEventListener("load", () => {
		iframe.contentWindow?.postMessage(
			{
				type: "adoExt:init",
				token: BRIDGE_TOKEN,
				payload: { org: ctx.org, project: ctx.project, pageUrl: location.href, ext: EXT_ID },
			},
			"*"
		);
	});

	// Close on click outside iframe
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) closeOverlay();
	});

	// Close on Escape (only while mounted)
	escapeHandler = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.preventDefault();
			closeOverlay();
		}
	};
	window.addEventListener("keydown", escapeHandler, true);
}

export function toggleOverlay(): void {
	if (isOverlayMounted()) closeOverlay();
	else openOverlay();
}
