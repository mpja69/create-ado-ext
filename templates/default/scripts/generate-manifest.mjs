import fs from "fs";
import path from "path";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = String(pkg.version || "0.0.0");

// Läs "bas-manifest" från public/
const publicManifestPath = path.resolve("scripts/templates/manifest.template.json");
const manifest = JSON.parse(fs.readFileSync(publicManifestPath, "utf8"));

// Sätt version från package.json
manifest.version = version;

// Skriv till dist/
const distManifestPath = path.resolve("dist/manifest.json");
fs.mkdirSync(path.dirname(distManifestPath), { recursive: true });

// Skriv “snygg” JSON (2 spaces) för att undvika konstig formatering
fs.writeFileSync(distManifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log("Generated dist/manifest.json with version:", version);
