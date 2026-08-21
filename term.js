import fs from 'node:fs';
import path from 'node:path';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const commands = [], binaries = commands;
const binDir = './bin', binIgnore = '.binignore';
const validBinExtensions = ['', '.js', '.mjs', '.cjs', '.tandybin', '.tandyjs', '.tjs'];
function readBinaries() {
	// Read binaries
	const binaries = fs.readdirSync(path.join(import.meta.dirname, binDir), { withFileTypes: true })
				.filter(e => e.isFile()).map(file => file.name);

	// Remove .binignore from binaries if it's there
	const binignoreIndex = binaries.indexOf(binIgnore);
	if (binignoreIndex >= 0)
		binaries.splice(binignoreIndex, 1);

	// Parse binary ignore list
	let ignore;
	try {
		const content = fs.readFileSync(path.join(import.meta.dirname, binDir, binIgnore), { encoding: 'utf-8' });
		try {
			ignore = JSON.parse(content);
		} catch {
			ignore = content.split(/\r?\n/).filter(Boolean);
		}
	} catch {
		ignore = [];
	}

	// Ignore binaries
	ignore.forEach(i => {
		const index = binaries.indexOf(i);
		if (index === -1) return;
		// console.log(`Ignored binary '${i}'`);
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

	const targetBinIndex = binaries.findIndex(bin => {
		const absPath = path.join(import.meta.dirname, binDir, bin);
		const extension = path.extname(absPath);
		const binName = path.parse(absPath).name;
		return validBinExtensions.includes(extension) && binName === name;
	}), targetBinFile = binaries[targetBinIndex];

	if (!commands.includes(targetBinFile))
		throw new ReferenceError(`The binary "${name}" does not exist.`);

	const importPath = path.join(import.meta.dirname, binDir, targetBinFile);
	const handler = await import(importPath);
	const handle = handler?.default ?? handler?.handle;
	if (handle == null)
		throw new SyntaxError(`The binary "${name}" does not have an addressible handle.`);
	return handle;
}
async function runBinary(name, params, flags) {
	const handler = await getHandler(name);

	const extensionlessBinaries = binaries.map(bin => {
		const absPath = path.join(import.meta.dirname, binDir, bin);
		return path.parse(absPath).name;
	});

	const parsedParams = params.map(param => {
		param = param.replaceAll(/\\u([0-9a-f]{4,})/gi, ($0, $1) => String.fromCharCode(parseInt($1, 16)));
		param = param.replaceAll(/\\o([0-7]+)/g, ($0, $1) => String.fromCharCode(parseInt($1, 8)));
		param = param.replaceAll(/\\b([01]+)/g, ($0, $1) => String.fromCharCode(parseInt($1, 2)));
		param = param.replaceAll(/\\x([0-9a-f]+)/gi, ($0, $1) => String.fromCharCode(parseInt($1, 16)));
		param = param.replaceAll(/\\ESC|\\e/g, '\x1b');
		return param;
	});
	const input = {
		args: [name, ...parsedParams],
		rawArgs: [name, params],
		binaries: extensionlessBinaries,
		rawBinaries: binaries,
		tandyDir: import.meta.dirname,
		flags,
		validBinExtensions,
	}
	if (handler instanceof AsyncFunction) {
		// console.log('Used async path');
		return await handler(input);
	} else {
		// console.log('Used sync path');
		return handler(input);
	}
}

export {
	readBinaries,
	getHandler,
	runBinary,

	binDir,
	binIgnore,
	binaries,
}
