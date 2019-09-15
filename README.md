<img width="75px" height="75px" float="right" align="right" alt="JS Logo" src="https://cdn0.iconfinder.com/data/icons/development-2/24/terminal-512.png" title="Javascript Modules"/>

# EVM-Lite CLI

[![npm version](https://badge.fury.io/js/evm-lite-cli.svg)](https://badge.fury.io/js/evm-lite-cli)

A Command Line Interface to interact with an [EVM-Lite](https://github.com/mosaicnetworks/evm-lite#readme) node.

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Commands](#commands)
    - [Documentation](#documentation)
    - [Flags](#flags)
4. [Data Directory](#data-directory)
5. [Proof of Authority](#proof-of-authority)
6. [Developers](#developers)

## Installation

You can easily install `evmlc` with NPM

```bash
npm install -g evm-lite-cli
```

or with `yarn`

```bash
yarn global add evm-lite-cli
```

## Getting Started

There is a [Getting Started Document](docs/getting-started.md) available.

## Commands

### Documentation

A list of all supported commands along with documentation can be found [here](docs/README.md).

### Flags

The global flag `-d, --datadir` specifies the directory where `keystore` and `evmlc.toml` are stored unless overwritten by specific flags.

```bash
evmlc --datadir [path] interactive
```

## Data Directory

The first time `evmlc` runs, and if no options are specified, it creates a
special directory in a default location, where it
stores any relevant information.

-   Linux: `~/.evmlite`
-   Mac OS: `~/Library/EVMLITE`
-   Windows: `~/AppData/Roaming/EVMLITE`

In particular, this directory contains the following items:

-   **evmlc.toml**: where global options are specified
-   **keystore**: where all encrypted account keys are stored

**This directory is shared by EVM-Lite**

### `evmlc.toml`

Example evmlc.toml:

```toml
[connection]
host = "localhost"
port = 8080

# transaction defaults
[defaults]
from = "moniker"
gas = 1000000
gasPrice = 0
```

_Note: `from` refers to the `moniker` of the account not the `address`._

To change default configuration values run `evmlc config set -i` or `evmlc c s -i`. You will be
taken to an interactive prompt to change connection and default values.

```console
$ evmlc config set -i

? Host: localhost
? Port: 8080
? From: moniker
? Gas: 1000000
? Gas Price: 0
```

## Proof of Authority

The Monet Hub uses Proof of Authority with EVM-Lite and Babble.

A [Proof of Authority Document](docs/proof-of-authority.md) is available.

## Developers

Notes for developers are in a [developers document](docs/developer.md).
