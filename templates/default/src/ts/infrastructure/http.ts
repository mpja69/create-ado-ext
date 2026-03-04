// src/ts/http.ts
import { createAdoFetchClient } from "./bridge";

export class SessionExpiredError extends Error {
	debug?: { status?: number; ct?: string; preview?: string };
	constructor(msg: string, debug?: SessionExpiredError["debug"]) {
		super(msg);
		this.name = "SessionExpiredError";
		this.debug = debug;
	}
}

function looksLikeSigninHtml(s: string): boolean {
	const p = s.slice(0, 400).toLowerCase();
	return p.includes("/_signin") || p.includes("<!doctype html") || p.includes("<html");
}

let sessionExpired = false;

// Tokenet kommer från app.ts (init-message). Vi vill kunna uppdatera det efter init.
let _token = "";
export function setBridgeToken(token: string) {
	_token = token;
}

export type BridgeRes = {
	ok: boolean;
	status: number;
	ct: string;
	body: string;
	cont?: string; // continuation token (om din bridge skickar med det)
};

const { adoFetchText } = createAdoFetchClient({
	getToken: () => _token,
	timeoutMs: 15_000,
});

// “HTTP” för ADO via bryggan
export async function adoFetch(url: string, init?: RequestInit): Promise<BridgeRes> {
	if (sessionExpired) {
		throw new SessionExpiredError("Session appears expired (short-circuit)", {
			status: 0,
			ct: "",
			preview: "Skipped due to prior session-expired detection",
		});
	}

	const res = await adoFetchText(url, init);

	// Om det ser ut som sign-in, slå på fuse så allt failar snabbt efteråt
	if ((!res.ok && (res.status === 0 || looksLikeSigninHtml(res.body))) || looksLikeSigninHtml(res.body)) {
		sessionExpired = true;
		throw new SessionExpiredError("Session appears expired", {
			status: res.status,
			ct: res.ct,
			preview: res.body.slice(0, 200),
		});
	}

	return res;
}

// JSON-parse med bra fel + session-expired detection
export async function safeJson<T = any>(res: BridgeRes, context: string): Promise<T> {
	const { ok, status, ct, body } = res;

	if (!ok) {
		if (status === 0 || looksLikeSigninHtml(body)) {
			sessionExpired = true;
			throw new SessionExpiredError("Session appears expired", { status, ct, preview: body.slice(0, 200) });
		}
		throw new Error(`[${context}] HTTP ${status}`);
	}

	if (!ct.includes("application/json")) {
		if (looksLikeSigninHtml(body)) {
			sessionExpired = true;
			throw new SessionExpiredError("Session appears expired", { status, ct, preview: body.slice(0, 200) });
		}
		throw new Error(`[${context}] non-JSON response (${ct})`);
	}

	return JSON.parse(body) as T;
}
