#!/usr/bin/env node
const forceDebugMode = false;

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Module imports
const term = require('./term.js');
const readline = require('readline/promises');
const os = require('os');
const fs = require('fs');
const path = require('path');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const minimist = require('./minimist-string');

// External command handler variables
const rawExArgs = process.argv.slice(2);
const parsedExArgs = minimist.parse(rawExArgs.join(' '));
const flags = Object.fromEntries(Object.entries(parsedExArgs).filter(kv => kv[0] !== '_')), exArgs = parsedExArgs._.map(String);
const tandyCommand = exArgs[0] ?? '';
const debugMode = forceDebugMode || Boolean(flags.d || flags.debug);

// Utility functions
function generateMessage(msg, padding = 0) {
	return `${'\n'.repeat(padding)}\x1B[1;36m[TaNDy${tandyCommand ? ': ' + tandyCommand : ''}]:\x1B[0m ${msg}`;
}
function generateLogFunction(logFn) {
	const log = (...args) => {
		if (typeof args[0] === 'string')
			args[0] = generateMessage(args[0]);
		else if (Number.isInteger(args[0]) && args[0] >= 0) {
			const padding = args[0];
			args.shift();
			args[0] = generateMessage(args[0], padding);
		}

		logFn(...args);
	}
	return log;
}
const log = generateLogFunction(console.log),
      error = generateLogFunction(console.error),
      debug = debugMode ? generateLogFunction(console.debug) : () => {/* suppressed */};

// Command processor
async function processCommand(command) {
	const uncommentedCommand = command.replace(/#.*$/g, '');
	const params = minimist.parse(uncommentedCommand);
	params._ = params._.map(String);

	// Get:
	const binary = params._[0], // Target binary
	      args = params._.slice(1); // Unflagged arguments

	if (binary == null) return; // Skip empty lines

	// Get flags
	const modifierFlags = Object.entries(params).filter(p => p[1] === true).map(p => p[0]);
	const valueFlags = Object.fromEntries(Object.entries(params).filter(p => typeof p[1] !== 'boolean'));
	delete valueFlags._;

	// Get flags object
	const flagsObj = structuredClone(params);
	delete flagsObj._;

	const result = await term.runBinary(binary, args, { values: valueFlags, modifiers: modifierFlags, obj: flagsObj }, rl);
	return result;
}
async function mainLoop() {
        try {
		const trimmedCWD = process.cwd().startsWith(os.homedir()) ? path.join('~', process.cwd().split(path.sep).slice(1 + 2).join(path.sep)) : process.cwd();
		const commandLines = [], rawCommandLines = [];
		do {
			const prompt = `\n\x1B[1;32m${os.userInfo().username}\x1B[0m@\x1B[1;34m${trimmedCWD}\x1B[0m${commandLines.length > 0 ? ` (${commandLines.length})` : ''};`;
			const commandLine = await rl.question(`${prompt} `),
			      cleanCommandLine = commandLine.endsWith('\\') ? commandLine.slice(0, -1) : commandLine;

			commandLines.push(cleanCommandLine);
			rawCommandLines.push(commandLine);
		} while (rawCommandLines.at(-1).endsWith('\\'));

		const results = [];
		for (const command of commandLines) {
	                const result = await processCommand(command);
			results.push(result);
		}
        } catch (err) {
                if (debugMode)
                        error('Exception!\n', err);
                else {
                        if (err.name != null && err.message != null)
                                error(`\x1B[1;41mUncaught ${err.name}\x1B[0m: ${err.message}`);
                        else
                                error(`\x1B[1;41mUncaught RawThrow\x1B[0m:`, err);
                }
        }
        return mainLoop();
}
rl.on('close', () => {
	log(1, 'Interface closed, exiting');
	process.exit(0);
});

// Intro
const printIntro = () => {
	console.clear();
	console.log(
` _______  _______  __    _  ______   __   __
|       ||   _   ||  |  | ||      | |  | |  |
|_     _||  |_|  ||   |_| ||  _    ||  |_|  |
  |   |  |       ||       || | |   ||       |
  |   |  |       ||  _    || |_|   ||_     _|
  |   |  |   _   || | |   ||       |  |   |
  |___|  |__| |__||_|  |__||______|   |___|

Welcome to TaNDy \x1B[1mv1.4.2\x1B[0m! \x1B[2m\/\/ GNU AGPL v3.0 @ 2026\x1B[0m
`
	);

	debug("\x1B[1;3;92mDebug mode enabled\x1B[0m");

	term.readBinaries();
	log(`Loaded \x1B[94m${term.binaries.length}\x1B[0m binar${term.binaries.length === 1 ? 'y' : 'ies'}`);
}

// External command handling
async function handleExternalCommand() {
	debug("Inputted arguments:", exArgs);
	switch (tandyCommand) {
		case '': case 'new':
			printIntro();
			return mainLoop();

		case 'run':
			const filename = exArgs[1];
			if (filename == null) {
				error(1, 'Missing target filename');
				process.exit(1);
			}
			debug(1, `Reading file...\n`);
			const code = fs.readFileSync(filename, { encoding: 'utf-8' });
			const commands = code.split(/\r?\n/).filter(Boolean).map(String);
			for (const [index, command] of commands.entries()) {
				try {
					debug('Executing command (${index + 1} of ${commands.length}):\n\t', command);
					await processCommand(command);
				} catch (err) {
					console.error(err);
					process.exit(1);
					return err; // Just in case
				}
			}
			process.exit(0);
			break;

		case 'interpret':
			const command = exArgs.slice(1).join(' ');
			debug('Executing command:\n\t', command);
			try {
				const exec = await processCommand(command);
				process.exit(0);
			} catch (err) {
				console.error(err);
				process.exit(1);
				return err; // Again, just in case
			}
	}
}
handleExternalCommand();
