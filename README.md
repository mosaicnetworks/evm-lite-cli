# EVM-Lite CLI

## _**Requires development version of `evm-lite-datadir`!**_

[![npm version](https://badge.fury.io/js/evm-lite-cli.svg)](https://badge.fury.io/js/evm-lite-cli)

A Command Line Interface to interact with [EVM-Lite](https://github.com/mosaicnetworks/evm-lite#readme) or [Monet](https://github.com/mosaicnetworks/monetd#readme) nodes.

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

The global flag `-d, --datadir` specifies the directory where `keystore` and `config.toml` are stored unless overwritten by specific flags.

_Note: that if this flag is not provided, it will default to `~/.evmlc`._

```bash
evmlc --datadir [path] interactive
```

## Data Directory

The first time `evmlc` runs, and if no options are specified, it creates a
special directory in a default location, where it
stores any relevant information.

-   Windows: `~/AppData/Roaming/EVMLC`
-   Mac OS: `~/Library/EVMLC`
-   Linux: `~/.evmlc`

In particular, this directory contains the following items:

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

## Proof of Authority

The Monet Hub using Proof of Authority with EVM-Lite and Babble. A [Proof of Authority Document](docs/proof-of-authority.md) is available.

## Developers

Notes for developers are in a [developers document](docs/developer.md).
