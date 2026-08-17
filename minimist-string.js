const minimist = require('minimist');

function parse(str, options) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	const args = str.match(/"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|[^\s"']+/g) || [];
	const cleanArgs = args.map(arg => {
		if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
			return arg.slice(1, -1);
    		}
		return arg;
	});

	return minimist(cleanArgs, options);
}

module.exports = parse;
