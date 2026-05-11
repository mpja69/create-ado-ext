import fs from "fs/promises";
import path from "path";

const SKIP_DIRS = new Set(["elm-stuff", "node_modules", ".git"]);

export async function copyDir(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const e of entries) {
		if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;

		const from = path.join(src, e.name);
		const to = path.join(dest, e.name);

		if (e.isDirectory()) {
			await copyDir(from, to);
		} else if (e.isFile()) {
			await fs.copyFile(from, to);
		}
	}
}
