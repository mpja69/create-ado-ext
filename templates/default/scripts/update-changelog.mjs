import fs from "fs";

const CHANGELOG = "CHANGELOG.md";
const RELEASE_NOTES = "RELEASE_NOTES.md";
const PKG = "package.json";

if (!fs.existsSync(CHANGELOG)) {
	console.error("CHANGELOG.md not found");
	process.exit(1);
}

if (!fs.existsSync(RELEASE_NOTES)) {
	console.error("RELEASE_NOTES.md not found");
	process.exit(1);
}

if (!fs.existsSync(PKG)) {
	console.error("package.json not found");
	process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const version = String(pkg.version || "").trim();

if (!version) {
	console.error("Could not read version from package.json");
	process.exit(1);
}

const changelog = fs.readFileSync(CHANGELOG, "utf8");
const releaseNotes = fs.readFileSync(RELEASE_NOTES, "utf8").trim();

const header = "# Changelog";

if (!changelog.startsWith(header)) {
	console.error("CHANGELOG.md must start with '# Changelog'");
	process.exit(1);
}

// Stop if this version already exists in changelog
const escapedVersion = version.replace(/\./g, "\\.");

const versionHeading = new RegExp(
	"^##\\s+\\[?" + escapedVersion + "\\]?\\b",
	"m"
);

if (versionHeading.test(changelog)) {
	console.error(`CHANGELOG.md already contains version ${version}`);
	process.exit(1);
}

// Remove release-notes title if present
const cleanedReleaseNotes = releaseNotes
	.replace(/^#\s*Release Notes\s*/i, "")
	.trim();

const updated =
	`${header}\n\n` +
	cleanedReleaseNotes +
	"\n\n" +
	changelog.replace(/^# Changelog\s*/, "").trim() +
	"\n";

fs.writeFileSync(CHANGELOG, updated, "utf8");

console.log(`CHANGELOG.md updated with version ${version}`);
