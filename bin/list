import * as fs from 'node:fs';
import * as path from 'node:path';

function handle({
	args,
	flags
} = {}) {
	if (flags.modifiers.includes('h') || flags.modifiers.includes('help')) {
		console.log("--help    (-h) - Shows this help\n");
		console.log("--file    (-F) - Only list files");
		console.log("--dir     (-D) - Only list directories");
		console.log("--symlink (-S) - Only list symbolic links");
		return;
	}


	const dir = args[1] ?? '.';
	const list = fs.readdirSync(dir, { withFileTypes: true });
	
	const ESC = '\x1b';
	for (const entry of list) {
		if (entry.isFile()) {
			if (flags.modifiers.includes('dir') || flags.modifiers.includes('D')) continue;
			if (flags.modifiers.includes('symlink') || flags.modifiers.includes('S')) continue;			

			// file
			const fullPath = path.join(dir, entry.name);
			try {
				fs.accessSync(fullPath, fs.constants.X_OK);
				console.log(`${ESC}[32m${entry.name}${ESC}[0m`);
			} catch {
				console.log(entry.name);
			}
		} else if (entry.isDirectory()) {
			if (flags.modifiers.includes('file') || flags.modifiers.includes('F')) continue;
			if (flags.modifiers.includes('symlink') || flags.modifiers.includes('S')) continue;

			// dir
			console.log(`${ESC}[93m${entry.name}${ESC}[0m`);
		} else if (entry.isSymbolicLink()) {
			if (flags.modifiers.includes('dir') || flags.modifiers.includes('D')) continue;
			if (flags.modifiers.includes('file') || flags.modifiers.includes('F')) continue;

			// symlink
			console.log(`${ESC}[1;36m${entry.name}${ESC}[0m`);
		} else {
			// unknown
			console.log(`${ESC}[1;31m?? ${entry.name}${ESC}[0m`);
		}
	}
}

export default handle;
