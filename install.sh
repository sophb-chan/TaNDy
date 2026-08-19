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

TANDY_DIR='.'
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

TEMP_DIR="./tandy_temp$((RANDOM % 100000000))"
mkdir "$TEMP_DIR"

npm i --quiet minimist --prefix "$TEMP_DIR"

shopt -s dotglob
if [ ! -d "$TANDY_DIR/node_modules" ]; then
	sudo mkdir "$TANDY_DIR/node_modules"
fi

sudo mv "$TEMP_DIR/node_modules"/* "$TANDY_DIR/node_modules"
sudo rm -r "$TEMP_DIR"

echo "Downloading 'term.js' (dependency)..."
sudo curl -sSo "$TANDY_DIR/term.js" "$TANDY_URL/term.js"

echo "Downloading 'minimist-string.js' (dependency)..."
sudo curl -sSo "$TANDY_DIR/minimist-string.js" "$TANDY_URL/minimist-string.js"

echo "Creating binaries directory..."
sudo mkdir "$TANDY_DIR/bin"

install_bin() {
	echo "Installing '$1' (TaNDy binary)..."
	sudo curl -sSo "$TANDY_DIR/bin/$1" "$BIN_URL/$1"
}

install_bin fetchbin.js
install_bin help.js


#if [ ! -f "$TANDY_DIR/tandy" ]; then
#	echo "Creating system-wide symlink..."
#	ln -s "$TANDY_DIR/tandy" '/usr/local/bin'
#	echo "Created successfully!"
#else
#	echo "Cannot create system-wide symlink: A file at /usr/local/bin/tandy already exists"
#	exit 1
#fi

REAL_TANDY_DIR=$(realpath "$TANDY_DIR")
echo "TaNDy was successfully installed to $REAL_TANDY_DIR!"
