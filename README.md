# EVM-Lite CLI

[![npm version](https://badge.fury.io/js/evm-lite-cli.svg)](https://badge.fury.io/js/evm-lite-cli)

A Command Line Interface to interact with an [EVM-Lite](https://github.com/mosaicnetworks/evm-lite#readme) node.

## Table of Contents

1. [Installation](#installation)
2. [Commands](#commands)
    - [Flags](#flags)
3. [Data Directory](#data-directory)

## Installation

You can easily install `evmlc` with NPM

```bash
$ npm install -g evm-lite-cli
```

or with `yarn`

```bash
$ yarn global add evm-lite-cli
```

## Commands

List commands:

```console
  _____  __     __  __  __   _        ____
 | ____| \ \   / / |  \/  | | |      / ___|
 |  _|    \ \ / /  | |\/| | | |     | |
 | |___    \ V /   | |  | | | |___  | |___
 |_____|    \_/    |_|  |_| |_____|  \____|

 Mode:        Interactive
 Data Dir:    /Users/danu/Library/MONET
 Config File: /Users/danu/Library/MONET/evmlc.toml
 Keystore:    /Users/danu/Library/MONET/keystore

  Change datadir by: $evmlc --datadir [path] [command]

  Commands:

    exit                                 Exit EVMLC
    help [command...]                    Provides help for a given command.
    accounts create [options] [moniker]  Creates an encrypted keypair locally
    accounts list [options]              List all accounts in the local keystore directory
    accounts get [options] [address]     Fetches account details from a connected node
    accounts update [options] [moniker]  Update passphrase for a local account
    accounts import [options] [moniker]  Import an encrypted keyfile to the keystore
    config view [options]                Output current configuration file
    config set [options]                 Set values of the configuration inside the data directory
    poa check [options] [address]        Check whether an address is on the whitelist
    poa whitelist [options]              List whitelist entries for a connected node
    poa nomineelist [options]            List nominees for a connected node
    poa nominate [options] [address]     Nominate an address to proceed to election
    poa vote [options] [address]         Vote for an nominee currently in election
    info [options]                       Display information about node
    transfer [options]                   Initiate a transfer of token(s) to an address
    version [options]                    Display current version of cli
    clear [options]                      Clear output on screen
```

### Flags

The global flag `-d, --datadir` specifies the directory where `keystore` and `evmlc.toml` are stored unless overwritten by specific flags.

```bash
$ evmlc --datadir <path> <command>
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

**This directory is shared by [EVM-Lite](https://github.com/mosaicnetworks/evm-lite#readme).**

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
