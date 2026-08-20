#!/usr/bin/env node
const debugMode = false;

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Module imports
const term = require('./term.js');
const readline = require('readline/promises');
const fs = require('fs');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const minimist = require('./minimist-string');

// External command handler variables
const exArgs = process.argv.slice(2);
const tandyCommand = exArgs[0] ?? '';

// Utility functions
function generateMessage(msg, padding = 0) {
	return `${'\n'.repeat(padding)}[TaNDy${tandyCommand ? ': ' + tandyCommand : ''}]: ${msg}`;
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

	// Get:
	const binary = params._[0], // Target binary
	      args = params._.slice(1); // Unflagged arguments

	if (binary == null) return; // Skip empty lines

	// Get flags
	const modifierFlags = Object.entries(params).filter(p => p[1] === true).map(p => p[0]);
	const valueFlags = Object.entries(params).filter(p => typeof p[1] !== 'boolean');

	const result = await term.runBinary(binary, args, { values: valueFlags, modifiers: modifierFlags });
	return result;
}
async function mainLoop() {
        try {
                const command = await rl.question(`\n${process.cwd()}; `);
                const result = await processCommand(command);
        } catch (err) {
                if (debugMode)
                        error('Exception!\n', err);
                else {
                        if (err.name != null && err.message != null)
                                error(`Uncaught ${err.name}: ${err.message}`);
                        else
                                error(`Uncaught RawThrow:`, err);
                }
        }
        mainLoop();
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

Welcome to TaNDy v1.1.0! \/\/ GNU AGPL v3.0 @ 2026
`
	);

	term.readBinaries();
	log('Loaded', term.binaries.length, `binar${term.binaries.length === 1 ? 'y' : 'ies'}`);
}

debug("\x1b[1;3;92mDebug mode enabled\x1b[0m");


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
			const commands = code.split(/\r?\n/).filter(Boolean);
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
