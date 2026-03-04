import fs from "fs/promises";
import path from "path";

export async function copyDir(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const e of entries) {
		const from = path.join(src, e.name);
		const to = path.join(dest, e.name);

		if (e.isDirectory()) {
			await copyDir(from, to);
		} else if (e.isFile()) {
			await fs.copyFile(from, to);
		}
	}
}
