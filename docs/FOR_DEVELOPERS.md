# Developer Documentation

This document contains helpful information for developers wanting to create for TaNDy.

## Table of Contents

- [Handle arguments API](#handle-arguments-api)

## Handle arguments API

The handler function should take in a destructured argument list.
Here is the structure of those arguments:
```js
{
	args: Array, // The list of fully parsed arguments
	rawArgs: Array, // The list of arguments without any extra parsing
	binaries: Array, // The list of binary names
	rawBinaries: Array, // The list of binary filenames without extra parsing
	tandyDir: String, // The directory to the currently running TaNDy installation
	tandyVer: String|null, // The version number for the TaNDy installation. This value may be null if `package.json` does not exist.
	flags: {
		values: Object, // Value flags: Values are Strings
		modifiers: Object, // Modifier flags - Values are Booleans
		obj: Object, // Raw flags object
	},
	validBinExtensions: Array, // Valid binary file extensions
	reloadBinaries: Function, // function to reload the list of installed binaries
	rlInterface: ReadlineInterface|null, // The 'readline' interface that TaNDy uses to communicate with the terminal. This value becomes `null` if the interface has been closed.
	debugMode: Boolean, // Whether debug mode is enabled (via --debug flag)
	flagsObj: Object, // The exact same thing as `flags.obj`
}
```
