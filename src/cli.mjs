#!/usr/bin/env node
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { copyDir } from "./lib/copy.mjs";
import { replaceTokensInDir } from "./lib/replace.mjs";
import { prompt } from "./lib/prompts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "templates", "default");

function die(msg) {
	console.error("❌ " + msg);
	process.exit(1);
}

function normalizePkgName(s) {
	return s
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

const targetDirArg = process.argv[2];
if (!targetDirArg) {
	die("Usage: npm create ado-ext <project-folder>");
}

const targetDir = path.resolve(process.cwd(), targetDirArg);
if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
	die(`Target folder is not empty: ${targetDir}`);
}

const extName = await prompt("Extension name", "My ADO Extension");
const description = await prompt("Description", "Browser extension for Azure DevOps");
const pkgNameDefault = normalizePkgName(extName) || "my-ado-extension";
const pkgName = normalizePkgName(await prompt("npm package name", pkgNameDefault));
const version = await prompt("Initial version", "0.1.0");
// Copy template
await copyDir(TEMPLATE_DIR, targetDir);

const extId = pkgName; // stabilt ID
const buttonText = extName;
const overlayId = `${pkgName}-overlay`;
const buttonId = `${pkgName}-button`;
const bridgeToken = crypto.randomBytes(12).toString("hex"); // 24 hex chars


// Replace tokens
await replaceTokensInDir(targetDir, {
	"__EXT_NAME__": extName,
	"__DESCRIPTION__": description,
	"__PKG_NAME__": pkgName,
	"__VERSION__": version,
	"__EXT_ID__": extId,
	"__BUTTON_TEXT__": buttonText,
	"__OVERLAY_ID__": overlayId,
	"__BUTTON_ID__": buttonId,
	"__BRIDGE_TOKEN__": bridgeToken
});

// Done
console.log("✅ Created project in:", targetDir);
console.log("");
console.log("Next:");
console.log(`  cd ${path.basename(targetDir)}`);
console.log("  npm install");
console.log("  npm run dev");
