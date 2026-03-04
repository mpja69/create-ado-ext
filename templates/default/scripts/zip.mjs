import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const version = pkg.version;
const name = pkg.name.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();

const distDir = path.resolve("dist");
const releaseDir = path.resolve("release");

if (!fs.existsSync(distDir)) {
	console.error("dist folder not found. Run build first.");
	process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });

const zipName = `${name}-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipPath);

console.log(`Created ${zipPath}`);
