#!/usr/bin/env bash

set -euo pipefail

echo "=== TaNDy Installer ==="

if command -v node &> /dev/null; then
	sleep 1
else
	echo "TaNDy requires NodeJS to run. Please install Node and run the installer after doing that."
	exit 1
fi

echo "Notice: The installer may ask for root permissions at any time, and may ask for your password."

TANDY_DIR='/usr/bin/tandy_install'
TANDY_URL='https://raw.githubusercontent.com/sophb-chan/TaNDy/main'
BIN_URL='https://raw.githubusercontent.com/sophb-chan/TaNDy-binaries/main'

if [ ! -d "$TANDY_DIR" ]; then
	sudo mkdir "$TANDY_DIR"
fi

echo "Downloading 'tandy'..."
sudo curl -sSo "$TANDY_DIR/tandy" "$TANDY_URL/tandy.js"

echo "Allowing 'tandy' to be executed..."
sudo chmod +x "$TANDY_DIR/tandy"

echo "Installing 'minimist' (dependency, NPM package)..."

while [ -d "$TEMP_DEPDIR"]; do
	TEMP_DEPDIR="./temp$((RANDOM % 100000000))" # different behavior in zsh(?)

	[ -d "$TEMP_DEPDIR" ] && break;
done
mkdir "$TEMP_DEPDIR"

npm i --quiet minimist --prefix "$TEMP_DEPDIR"

shopt -s dotglob
if [ ! -d "$TANDY_DIR/node_modules" ]; then;
	sudo mkdir "$TANDY_DIR/node_modules"
fi

sudo mv "$TEMP_DEPDIR/*" "$TANDY_DIR/node_modules"
sudo rm -r "$TEMP_DEPDIR"

echo "Downloading 'term.js' (dependency)..."
sudo curl -sSo "$TANDY_DIR/term.js" "$TANDY_URL/term.js"

echo "Creating binaries directory..."
sudo mkdir "$TANDY_DIR/bin"

# install_bin() {
# 	echo "Installing '$1' (TaNDy binary)..."
#	curl -sSo "$TANDY_DIR/bin/$1" "$BIN_URL/$1"
# }

# install_bin fetchbin

echo "Installing 'fetchbin' (TaNDy binary)..."
curl -sSo "$TANDY_DIR/bin/fetchbin" "$BIN_URL/fetchbin"

echo "Installing 'help' (TaNDy binary)..."
curl -sSo "$TANDY_DIR/bin/help" "$BIN_URL/help"

if [ ! -f "$TANDY_DIR/tandy" ]; then
	echo "Creating system-wide symlink..."
	ln -s "$TANDY_DIR/tandy" '/usr/local/bin'
	echo "Created successfully!"
else
	echo "Cannot create system-wide symlink: A file at /usr/local/bin/tandy already exists"
	exit 1
fi

REAL_TANDY_DIR=$(realpath "$TANDY_DIR")
echo "TaNDy was successfully installed to $REAL_TANDY_DIR!"
