import fs from "fs/promises";
import path from "path";

const TEXT_EXT = new Set([
	".json", ".js", ".mjs", ".ts", ".html", ".css", ".elm", ".md", ".txt", ".yml", ".yaml"
]);

async function walk(dir) {
	const out = [];
	const entries = await fs.readdir(dir, { withFileTypes: true });
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...await walk(full));
		else out.push(full);
	}
	return out;
}

function isTextFile(file) {
	const ext = path.extname(file).toLowerCase();
	return TEXT_EXT.has(ext);
}

export async function replaceTokensInDir(rootDir, tokenMap) {
	const files = await walk(rootDir);

	for (const file of files) {
		if (!isTextFile(file)) continue;

		let s = await fs.readFile(file, "utf8");
		let changed = false;

		for (const [token, value] of Object.entries(tokenMap)) {
			if (s.includes(token)) {
				s = s.split(token).join(value);
				changed = true;
			}
		}

		if (changed) {
			await fs.writeFile(file, s, "utf8");
		}
	}
}
