// scripts/build.mjs
import { execa } from "execa";
import fs from "fs-extra";
import esbuild from "esbuild";
import elmPlugin from "esbuild-plugin-elm";
import path from "path";
import { fileURLToPath } from "url";

// quiet logging
const QUIET = process.argv.includes("--quiet") || process.env.QUIET === "1";
const log = (...a) => { if (!QUIET) console.log(...a); };
const ok = (...a) => console.log(...a);
const err = (...a) => console.error(...a);

const isDev = process.env.NODE_ENV === "development";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "../dist");
const publicDir = path.join(__dirname, "../public");

// TS entry points
const tsScripts = {
	content: {
		entry: path.join(__dirname, "../src/ts/content.ts"),
		output: path.join(distDir, "content.js")
	},
	app: {
		entry: path.join(__dirname, "../src/ts/app.ts"),
		output: path.join(distDir, "app.js")
	}
};

async function build() {
	log(`🔨 Starting ${isDev ? "development" : "production"} build...`);


	// Clean dist
	await fs.remove(distDir);
	await fs.ensureDir(distDir);

	await execa("node", ["scripts/generate-version.mjs"], { stdio: "inherit" });
	await execa("node", ["scripts/generate-manifest.mjs"], { stdio: "inherit" });

	// Copy static files
	const staticFiles = await fs.readdir(publicDir);
	for (const file of staticFiles) {
		await fs.copy(path.join(publicDir, file), path.join(distDir, file));
	}

	// Compile TS entry points
	for (const name in tsScripts) {
		const { entry, output } = tsScripts[name];
		await esbuild.build({
			entryPoints: [entry],
			outfile: output,
			bundle: true,
			minify: !isDev,
			plugins: [elmPlugin({ debug: isDev })],
			target: "es2020",
			define: {
				__DEV__: JSON.stringify(isDev),
			},
		});
	}


	try {
		await execa("npx", [
			"tailwindcss",
			"-i", "./src/styles.css",
			"-o", "./dist/tailwind.css"
		], {
			stdio: "inherit",
			env: {
				...process.env,
				NODE_ENV: "production",
			},
		});
	} catch (error) {
		console.error("❌ Failed to build Tailwind CSS:", error);
		process.exit(1);
	}
	// Build MkDocs into dist/help (optional: only if you have mkdocs.yml)
	// const ROOT = path.join(__dirname, "..");
	// const helpOutDir = path.join(ROOT, "out", "help-site");
	// try {
	// 	await execa(
	// 		"mkdocs",
	// 		["build", "-f", "./help/mkdocs.yml", "-d", helpOutDir],
	// 		{
	// 			stdio: "inherit",
	// 			cwd: ROOT,
	// 			env: process.env,
	// 		}
	// 	);
	// } catch (error) {
	// 	console.error("❌ Failed to build MkDocs:", error);
	// 	process.exit(1);
	// }

	ok("✅ Done!");
}

build().catch((err) => {
	console.error("❌ Build failed:", err);
	process.exit(1);
});

