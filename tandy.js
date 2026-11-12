#!/usr/bin/env node
const forceDebugMode = false;

// Module imports
import * as term from './term.js';
import * as readline from 'readline/promises';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as minimist from './minimist-string.js';
import { fileURLToPath } from 'node:url';
import { TaskManager } from './taskmgr.js';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Version number
const versionNumber = (() => {
	try {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const packageJSON = fs.readFileSync(path.join(__dirname, './package.json'), { encoding: 'utf-8' });
		const parsed = JSON.parse(packageJSON);
		return parsed.version;
	} catch (err) {
		return null;
	}
})();

// External command handler variables
const rawExArgs = process.argv.slice(2);
const parsedExArgs = minimist.parse(rawExArgs.join(' '));
const flags = Object.fromEntries(Object.entries(parsedExArgs).filter(kv => kv[0] !== '_')), exArgs = parsedExArgs._.map(String);
const subcommand = exArgs[0] ?? '';
const debugMode = forceDebugMode || Boolean(flags.d || flags.debug);

// Utility functions
function generateMessage(msg, padding = 0) {
	return `${'\n'.repeat(padding)}\x1B[1;36m[TaNDy${subcommand ? ': ' + subcommand : ''}]:\x1B[0m ${msg}`;
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
const toExitCode = value => Math.trunc(Math.min(255, Math.max(0, Number(value) || 0)));

// Task manager
const taskmgr = new TaskManager;

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
	const modifierFlags = Object.entries(params).filter(p => typeof p[1] === 'boolean');
	const legacyModifierFlags = Object.entries(params).filter(p => p[1] === true).map(v => v[0]);
	const valueFlags = Object.fromEntries(Object.entries(params).filter(p => typeof p[1] !== 'boolean'));
	delete valueFlags._;

	// Get flags object
	const flagsObj = structuredClone(params);
	delete flagsObj._;

	taskmgr.addTask('runbinary');
	const result = await term.runBinary(
		binary,
		args,
		{
			values: valueFlags,
			legacyModifiers: legacyModifierFlags,
			modifiers: Object.fromEntries(modifierFlags),
			obj: flagsObj,
		},
		{
			rlInterface: rl,
			debugMode,
			flagsObj,
			tandyVer: versionNumber,
		}
	);
	taskmgr.removeTask('runbinary');
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
			const result = await processCommand(command), exitCode = toExitCode(result);
			results.push([result, exitCode]);
		}
		if (results.some(([r, exit]) => exit !== 0))
			console.warn('Some commands finished with a non-zero exit code.');
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
}
rl.on('close', () => {
	const taskCount = taskmgr.taskCount;
	if (taskCount > 0) {
		console.log(`Interrupted while ${taskCount} task${taskCount === 1 ? ' was' : 's were'} in progress.`);
	} else {
		log(1, 'Interface closed, exiting');
		process.exit(0);
	}
});

// Intro
const printIntro = () => {
	if (!debugMode) console.clear();
	console.log(
` _______  _______  __    _  ______   __   __
|       ||   _   ||  |  | ||      | |  | |  |
|_     _||  |_|  ||   |_| ||  _    ||  |_|  |
  |   |  |       ||       || | |   ||       |
  |   |  |       ||  _    || |_|   ||_     _|
  |   |  |   _   || | |   ||       |  |   |
  |___|  |__| |__||_|  |__||______|   |___|

Welcome to ${
	versionNumber == null
	? '\x1B[1mTaNDy'
	: `TaNDy \x1B[1mv${versionNumber}`
}\x1B[0m! \x1B[2m\/\/ GNU AGPL v3.0 @ 2026\x1B[0m
`
	);

	debug("\x1B[1;3;92mDebug mode enabled\x1B[0m");

	term.readBinaries();
	log(`Loaded \x1B[94m${term.binaries.length}\x1B[0m binar${term.binaries.length === 1 ? 'y' : 'ies'}`);
}

// External command handling
async function handleSubcommand() {
	debug("Inputted arguments:", exArgs);
	switch (subcommand) {
		case '':
		case 'new':
			printIntro();
			while (true) {
				await mainLoop();
			}
			break;

		case 'run':
			const filename = exArgs[1];
			if (filename == null) {
				error(1, 'Missing target filename');
				process.exit(1);
			}
			try {
				debug(1, `Reading file...\n`);
				taskmgr.addTask('readprg');
				const code = fs.readFileSync(filename, { encoding: 'utf-8' });
				taskmgr.removeTask('readprg');
				const commands = code.split(/\r?\n|\r/).filter(Boolean).map(String);
				for (const [index, command] of commands.entries()) {
					debug(`Executing command (${index + 1} of ${commands.length}):\n\t`, command);
					const result = await processCommand(command), exitCode = toExitCode(result);
					if (exitCode !== 0) process.exit(exitCode);
				}
			} catch (err) {
				taskmgr.removeTask('readfile');
				console.error(err);
				process.exit(1);
			}
			break;

		case 'interpret':
			const command = exArgs.slice(1).join(' ');
			debug('Executing command:\n\t', command);
			try {
				const result = await processCommand(command), exitCode = toExitCode(result);
				process.exit(exitCode);
			} catch (err) {
				console.error(err);
				process.exit(1);
			}
			break;

		case 'help':
			console.log(
`
===== TaNDy - Usage help =====

# Subcommands
help - Shows this
run - Run a TaNDy program
interpret - Interprets a TaNDy command without opening a prompt interface.
new - Open a new TaNDy session (same thing as not inputting a subcommand)

# Flags
-d / --debug - Enables helpful debug logs and functionality
`.trim()
			);
			break;

		default:
			console.error(`Unknown subcommand: "${subcommand}"`);
			process.exit(1);
	}
}
handleSubcommand();
