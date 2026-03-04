import readline from "readline";

export function prompt(label, defaultValue = "") {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const suffix = defaultValue ? ` (${defaultValue})` : "";
	return new Promise((resolve) => {
		rl.question(`${label}${suffix}: `, (answer) => {
			rl.close();
			const v = (answer || "").trim();
			resolve(v.length ? v : defaultValue);
		});
	});
}
