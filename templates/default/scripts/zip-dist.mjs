import fs from "fs";
import path from "path";
import { execa } from "execa";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const name = (pkg.name || "extension").replace(/[^a-z0-9-_]+/gi, "-");
const version = String(pkg.version || "0.0.0");

const outDir = path.resolve("out");
const zipName = `${name}-${version}.zip`;
const zipPath = path.join(outDir, zipName);

fs.mkdirSync(outDir, { recursive: true });

// zip dist -> out/<name>-<version>.zip
// mac/linux: zip installed by default
await execa("zip", ["-r", zipPath, "dist"], { stdio: "inherit" });

console.log("✅ Created", zipPath);
