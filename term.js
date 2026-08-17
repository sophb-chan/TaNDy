import fs from 'node:fs';
import path from 'node:path';

const commands = [], binaries = commands;
let binDir = './bin';
function readBinaries() {
	const binaries = fs.readdirSync(path.join(import.meta.dirname, binDir), { withFileTypes: true })
				.filter(e => e.isFile()).map(file => file.name);
	binaries.splice(binaries.indexOf('.binignore'), 1);

	let ignore;
	try {
		const content = fs.readFileSync(path.join(import.meta.dirname, binDir, '.binignore'), { encoding: 'utf-8' });
		try {
			ignore = JSON.parse(content);
		} catch {
			ignore = content.split(/\r?\n/).filter(Boolean);
		}
	} catch {
		ignore = [];
	}

	ignore.forEach(i => {
		const index = binaries.indexOf(i);
		if (index === -1) return;
		binaries.splice(index, 1);
	});

	commands.length = 0;
	commands.push(...binaries);
	return binaries;
}
async function getHandler(name) {
	if (commands.length === 0) readBinaries();
	if (commands.length === 0)
		throw new Error('No binaries exist.');
	if (!commands.includes(name))
		throw new ReferenceError(`The binary "${name}" does not exist.`);

	const importPath = path.join(import.meta.dirname, binDir, name);
	const handler = await import(importPath);
	const handle = handler?.default ?? handler?.handle;
	if (handle == null)
		throw new SyntaxError(`The binary "${name}" does not have an addressible handle.`);
	return handle;
}
async function runBinary(name, params, flags) {
	const handler = await getHandler(name);
	return handler({
		args: [name, ...params],
		binaries,
		flags,
	});
}

export {
	readBinaries,
	getHandler,
	runBinary,

	binDir,
	binaries
}
