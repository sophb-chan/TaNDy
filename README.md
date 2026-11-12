# TaNDy

TaNDy is a terminal emulator written in NodeJS.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [For developers](#for-developers)
<!-- - [Package management](#package-management) -->
- [**Extra trivia**: Where did the name come from?](#extra-trivia-where-did-the-name-come-from)

## Installation

Install TaNDy by downloading and executing the install script:
```bash
curl -fsSL https://raw.githubusercontent.com/sophb-chan/TaNDy/main/install.sh | env bash
```

<!--
## Package management
TBD
-->

## Usage

```
run - Run a TaNDy program*
interpret - Interprets a TaNDy command without opening a prompt interface.
new - Open a new TaNDy session (same thing as not inputting a subcommand)
```

(*TaNDy programs are just sequences of TaNDy commands in a file. This can be helpful for automation.)

You can get extensive usage help directly via TaNDy by using the `help` subcommand.

## For developers:

Access helpful documentation aimed at developers [here](/docs/FOR_DEVELOPERS.md),
and access breaking changes [here](/docs/BREAKING_CHANGES.md).

## Extra trivia: Where did the name come from?

The name originated from wordplay with "*Tele*type" (a.k.a. TTY) and Node (from *Node*JS).
I merged both of those into "Tele-node". Acronymizing, "*T*ele-*n*o*d*e" resulted in "TND", and I added the A and Y just to make the name marketable.
