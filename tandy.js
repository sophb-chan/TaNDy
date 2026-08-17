#!/usr/bin/env node
console.clear();
const debugMode = false;

const term = require('./term.js');
const readline = require('readline/promises');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const minimist = require('./minimist-string');

async function processCommand(command) {
	const params = minimist(command);

	// Get:
	//     target binary     &  unflagged arguments
	const binary = params._[0], args = params._.slice(1);
	if (binary == null) return;

	// Get flags
	const modifierFlags = Object.entries(params).filter(p => p[1] === true).map(p => p[0]);
	const valueFlags = Object.entries(params).filter(p => typeof p[1] !== 'boolean');

	const result = await term.runBinary(binary, args, { values: valueFlags, modifiers: modifierFlags });
	return result;
}

rl.on('close', () => {
	console.log('\n[TaNDy] Interface closed');
	process.exit(0);
});

// Intro
console.log(`
 _______  _______  __    _  ______   __   __
|       ||   _   ||  |  | ||      | |  | |  |
|_     _||  |_|  ||   |_| ||  _    ||  |_|  |
  |   |  |       ||       || | |   ||       |
  |   |  |       ||  _    || |_|   ||_     _|
  |   |  |   _   || | |   ||       |  |   |
  |___|  |__| |__||_|  |__||______|   |___|

Welcome to TaNDy! \/\/ GNU AGPL v3.0 @ 2026
v1.0.4
`);

term.readBinaries();
console.log('Loaded', term.binaries.length, `binar${term.binaries.length === 1 ? 'y' : 'ies'}\n`);

if (debugMode) console.log("\x1b[1;3;92mDebug mode enabled\x1b[0m");

async function mainLoop() {
	try {
		const command = await rl.question(`\n${process.cwd()}; `);
		const result = await processCommand(command);
	} catch (err) {
		if (debugMode) {
			console.error('[TaNDy] Exception!');
			console.error(err);
		} else {
			if (err.name != null && err.message != null)
				console.error(`[TaNDy] Uncaught ${err.name}: ${err.message}`);
			else
				console.error(`[TaNDy] Uncaught RawThrow:`, err);
		}
	}
	mainLoop();
}
mainLoop();
