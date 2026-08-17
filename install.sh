#!/usr/bin/env bash

set -euo pipefail

echo "=== TaNDy Installer ==="

if command -v node &> /dev/null; then
	sleep 1
else
	echo "TaNDy requires NodeJS to run. Please install Node and run the installer after doing that."
	exit 1
fi

TANDY_DIR='./tandy'
TANDY_URL='https://raw.githubusercontent.com/sophb-chan/TaNDy/main'
BIN_URL='https://raw.githubusercontent.com/sophb-chan/TaNDy-binaries/main'

if [ ! -d "$TANDY_DIR" ]; then
	mkdir "$TANDY_DIR"
fi

echo "Downloading 'tandy'..."
curl -sSo "$TANDY_DIR"/tandy "$TANDY_URL/tandy.js"

echo "Allowing 'tandy' to be executed..."
chmod +x "$TANDY_DIR"/tandy

echo "Installing 'minimist' (dependency, NPM package)..."
npm i -s minimist --prefix "$TANDY_DIR"

echo "Downloading 'term.js' (dependency)..."
curl -sSo "$TANDY_DIR"/term.js "$TANDY_URL/term.js"

echo "Creating binaries directory..."
mkdir "$TANDY_DIR"/bin

# install_bin() {
# 	echo "Installing '$1' (TaNDy binary)..."
#	curl -sSo "$TANDY_DIR/bin/$1" "$BIN_URL/$1"
# }

# install_bin fetchbin

echo "Installing 'fetchbin' (TaNDy binary)..."
curl -sSo "$TANDY_DIR/bin/fetchbin" "$BIN_URL/fetchbin"

echo "Installing 'help' (TaNDy binary)..."
curl -sSo "$TANDY_DIR/bin/help" "$BIN_URL/help"

REAL_TANDY_DIR=$(realpath "$TANDY_DIR")
echo "TaNDy was successfully installed to $REAL_TANDY_DIR!"
