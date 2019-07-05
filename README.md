# EVM-Lite CLI [![npm version](https://badge.fury.io/js/evm-lite-cli.svg)](https://badge.fury.io/js/evm-lite-cli)

> A Command Line Interface to interact with [EVM-Lite](https://github.com/mosaicnetworks/evm-lite#readme) or [Monet](https://github.com/mosaicnetworks/monetd#readme) nodes

## Table of Contents

1. [Installation](#Installation)
2. [Development](#Development)
3. [Commands](#Commands)
4. [Data Directory](#Data-Directory)
5. [Getting Started](docs/getting-started.md)
6. [Proof of Authority](docs/proof-of-authority.md)

## Installation

You can easily install `evmlc` with NPM

```bash
npm install -g evm-lite-cli
```

or with `yarn`

```bash
yarn global add evm-lite-cli
```

## Development

To begin with, you will need to install Node and NPM, which are bundled together
in the installation package from the [Node website](https://nodejs.org/en/).

This project was built with Node version `10.16.0`.

Firstly you will need to install dependencies

```bash
npm install
```

or with `yarn`

```bash
yarn install
```

This should also transpile typescript files into `dist/`.

For development, it is advised to use

```bash
npm run i
```

to test the CLI. This is a wrapper script which runs the CLI directly from the source files.

Alternatively you can run `npm link` and access the CLI through `evmlc` however any changes made to the source files needs to be transpiled before changes are seen.

## Commands

By default, all commands will output raw JSON or strings unless the `-f, --formatted` flag
is provided.

The global flag `-d, --datadir` specifies the directory where `keystore` and `config.toml` are stored unless overwritten by specific flags.

_Note: that if this flag is not provided, it will default to `~/.evmlc`._

```bash
evmlc --datadir [path] interactive
```

## Data Directory

The first time `evmlc` runs, and if no options are specified, it creates a
special directory in a default location (`~/.evmlc` on Linux and Mac), where it
stores any relevant information. In particular, this directory contains the
following items:

-   **config.toml**: where global options are specified. These values may be
    overwritten by CLI flags.
-   **keystore**: where all encrypted account keys are stored.

### `config.toml`

Example config.toml:

```toml
[connection]
host = "127.0.0.1"
port = 8000

[defaults]
from = "0x702B0ad02a7a6056EB16A697A96d849c228F5fB4"
gas = 1000000000000
gasPrice = 0
```

To change default configuration values run `evmlc config set -i` or `evmlc c s -i`. You will be
taken to an interactive prompt to change connection and default values.

```console
$ evmlc config set -i

? Host: 127.0.0.1
? Port: 8000
? From: 0x702B0ad02a7a6056EB16A697A96d849c228F5fB4
? Gas: 1000000000000
? Gas Price: 0
```
