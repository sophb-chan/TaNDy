import fs from 'node:fs';
import path from 'node:path';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const binaries = [];
const binDir = path.join(import.meta.dirname, './bin'), binIgnore = '.binignore';
const validBinExtensions = ['', '.js', '.mjs', '.cjs', '.tandybin', '.tandyjs', '.tjs'];
function readBinaries() {
	// Read binaries
<<<<<<< HEAD
	const binariesRead = fs.readdirSync(binDir, { withFileTypes: true })
=======
	const binaries = fs.readdirSync(binDir, { withFileTypes: true })
>>>>>>> 8755fa5cede1a38ea8f3092d9dffd72de5357ccd
		.filter(e => e.isFile()).map(file => file.name);

	// Remove .binignore from binaries if it's there
	const binignoreIndex = binariesRead.indexOf(binIgnore);
	if (binignoreIndex >= 0)
		binariesRead.splice(binignoreIndex, 1);

	// Parse binary ignore list
	let ignore;
	try {
		const content = fs.readFileSync(path.join(binDir, binIgnore), { encoding: 'utf-8' });
		try {
			// Try to parse as JSON
			ignore = JSON.parse(content);
		} catch {
			// Try to parse as line-separated list
			ignore = content.split(/\r?\n/).filter(Boolean).map(i => i.trim());
		}
	} catch {
		ignore = [];
	}
	if (!Array.isArray(ignore))
		throw new TypeError(`The binary ignore list must be of the type 'array', not of the type '${Object.typeOf(ignore)}'.`);

	// Ignore binaries
	ignore.forEach(i => {
		const index = binariesRead.indexOf(i);
		if (index === -1) return;
		// console.log(`Ignored binary '${i}'`);
			binariesRead.splice(index, 1);
	});

<<<<<<< HEAD
	binariesRead.sort();
	binaries.length = 0;
	binaries.push(...binariesRead);

	return binariesRead;
=======
	binaries.sort();
	binaries.length = 0;
	binaries.push(...binaries);
	return binaries;
>>>>>>> 8755fa5cede1a38ea8f3092d9dffd72de5357ccd
}
async function getHandler(name) {
	if (binaries.length === 0) readBinaries();
	if (binaries.length === 0)
		throw new Error('No binaries exist.');

	const targetBinIndex = binaries.findIndex(bin => {
		const absPath = path.join(binDir, bin);
		const extension = path.extname(absPath);
		const binName = path.parse(absPath).name;
		return validBinExtensions.includes(extension) && binName === name;
	}), targetBinFile = binaries[targetBinIndex];

	if (!binaries.includes(targetBinFile))
		throw new ReferenceError(`The binary "${name}" does not exist.`);

	const importPath = path.join(binDir, targetBinFile);
	const code = fs.readFileSync(importPath, { encoding: 'utf-8' }),
	      B64code = Buffer.from(code).toString('base64');
	const dataURI = `data:text/javascript;base64,${B64code}`;
	const handler = await import(dataURI);
	const handle = handler?.default ?? handler?.handle;
	if (handle == null)
		throw new SyntaxError(`The binary "${name}" does not have an addressible handle.`);
	return handle;
}
async function runBinary(name, params, flags, customArgs) {
	const handler = await getHandler(name);

	const extensionlessBinaries = binaries.map(bin => {
		const absPath = path.join(binDir, bin);
		return path.parse(absPath).name;
	});

	const parsedParams = params.map(param => {
		param = param.toString();
		param = param.replaceAll('\\n', '\n');
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
		reloadBinaries: readBinaries,
		binDir,
		...customArgs
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
