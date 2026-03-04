// templates/mv3-iframe-overlay/src/ts/bridge.ts
//
// Shared message contract + helpers for the iframe<->content "adoFetch" bridge.
//
// Why this file exists:
// - Avoid duplicating message types in both app.ts and content.ts
// - Keep the protocol stable and easy to reuse across new apps

export type AdoFetchMsg = {
	type: "adoFetch";
	token: string;
	reqId: string;
	url: string;
	init?: RequestInit;
};

export type AdoFetchResultMsg = {
	type: "adoFetchResult";
	reqId: string;
	ok: boolean;
	status: number;
	ct: string;
	body: string;
	cont?: string;
};

export function isAdoFetchMsg(x: any): x is AdoFetchMsg {
	return (
		x &&
		x.type === "adoFetch" &&
		typeof x.token === "string" &&
		typeof x.reqId === "string" &&
		typeof x.url === "string"
	);
}

export function isAdoFetchResultMsg(x: any): x is AdoFetchResultMsg {
	return (
		x &&
		x.type === "adoFetchResult" &&
		typeof x.reqId === "string" &&
		typeof x.ok === "boolean" &&
		typeof x.status === "number" &&
		typeof x.ct === "string" &&
		typeof x.body === "string"
	);
}

/**
 * Create an iframe-side client that calls fetch via the content-script.
 * (Iframe can't reliably call ADO APIs with credentials; content-script can.)
 */
export function createAdoFetchClient(opts: {
	getToken: () => string;
	timeoutMs?: number;
}): {
	adoFetchText: (url: string, init?: RequestInit) => Promise<AdoFetchResultMsg>;
	adoFetchJson: <T>(url: string, init?: RequestInit) => Promise<T>;
} {
	const timeoutMs = opts.timeoutMs ?? 30_000;

	function adoFetchText(url: string, init?: RequestInit): Promise<AdoFetchResultMsg> {
		const reqId = crypto.randomUUID();
		const msg: AdoFetchMsg = {
			type: "adoFetch",
			token: opts.getToken(),
			reqId,
			url,
			init,
		};

		return new Promise((resolve, reject) => {
			const t = window.setTimeout(() => {
				window.removeEventListener("message", onResult);
				reject(new Error("adoFetch timeout"));
			}, timeoutMs);

			const onResult = (event: MessageEvent) => {
				const res = event.data;
				if (!isAdoFetchResultMsg(res)) return;
				if (res.reqId !== reqId) return;

				window.clearTimeout(t);
				window.removeEventListener("message", onResult);
				resolve(res);
			};

			window.addEventListener("message", onResult);
			window.parent.postMessage(msg, "*");
		});
	}

	async function adoFetchJson<T>(url: string, init?: RequestInit): Promise<T> {
		const res = await adoFetchText(url, init);
		if (!res.ok) {
			throw new Error(`adoFetch failed (${res.status}): ${res.body.slice(0, 200)}`);
		}
		return JSON.parse(res.body) as T;
	}

	return { adoFetchText, adoFetchJson };
}

/**
 * Create a content-script side handler that:
 * - validates token
 * - allow-lists URLs
 * - performs fetch with credentials
 * - responds with AdoFetchResultMsg
 */
export function createAdoFetchHandler(opts: {
	token: string;
	allowUrl: RegExp;
}): (event: MessageEvent) => Promise<void> {
	return async function onMessage(event: MessageEvent) {
		const msg = event.data;
		if (!isAdoFetchMsg(msg)) return;
		if (msg.token !== opts.token) return;

		const { reqId, url, init } = msg;

		try {
			if (!opts.allowUrl.test(url)) throw new Error("blocked url");

			const res = await fetch(url, { ...init, credentials: "include" });
			const ct = res.headers.get("content-type") || "";
			const cont = res.headers.get("x-ms-continuationtoken") || "";
			const status = res.status;
			const body = await res.text();

			const out: AdoFetchResultMsg = { type: "adoFetchResult", reqId, ok: res.ok, status, ct, body, cont };
			event.source?.postMessage(out, "*");
		} catch (err: any) {
			const out: AdoFetchResultMsg = {
				type: "adoFetchResult",
				reqId,
				ok: false,
				status: 0,
				ct: "",
				body: String(err?.message || err),
			};
			event.source?.postMessage(out, "*");
		}
	};
}
