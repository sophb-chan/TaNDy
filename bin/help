function handle({
	binaries
}) {
	let listString = '';
	const width = 10;
	for (const [index, binary] of binaries.entries()) {
		listString += binary;
		if ((index % 15 === 0 && index !== 0) || width === 1) listString += '\n';
		else if (index !== binaries.length - 1) listString += ', ';
	}
	console.log("\x1b[1;97mCommands:\x1b[0m\n");
	console.log(listString);
}
export default handle;
