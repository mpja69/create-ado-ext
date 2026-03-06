import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = pkg.version;

const today = new Date().toISOString().slice(0, 10);

const file = "RELEASE_NOTES.md";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
	/^##\s+.+$/m,
	`## [${version}] - ${today}`
);

fs.writeFileSync(file, content, "utf8");

console.log(`Updated RELEASE_NOTES.md to version ${version}`);
