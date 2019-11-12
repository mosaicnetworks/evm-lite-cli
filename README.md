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

### Flags

The global flag `-d, --datadir` specifies the directory where `keystore` and `evmlc.toml` are stored unless overwritten by specific flags.

```bash
$ evmlc --datadir <path> <command>
```

Commands also have two logging level flags `--silent` and `--debug` which will silence and show debug logs respectively.

**By default all commands will output formatted output. If you wish to script or require a JSON output use the `-j, --json` flag**.

For example to show JSON and debug output for the `info` command:

```json
$ evmlc info --json --debug

[DEBUG] evmlc http GET camille.monet.network:8080/info

{"consensus_events":"218","consensus_transactions":"17","events_per_second":"0.00","id":"3048798009","last_block_index":"18","last_consensus_round":"83","last_peer_change":"82","min_gas_price":"10","monik
er":"mosaic","num_peers":"3","round_events":"0","rounds_per_second":"0.00","state":"Babbling","sync_rate":"1.00","time":"1573554669678999304","transaction_pool":"0","type":"babble","undetermined_events":"
17"}
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

# The IP address of the EVM-Lite node
host = "localhost"

# The listening port of the EVM-Lite service
port = 8080

[defaults]

# Moniker of the account to be used as default
# usually the filename of the keyfile
from = "moniker"

# Gas will only default to this value for contract
# calls as transfer will take a maximum of 21000 gas
gas = 1000000

# DEPRECATED
# Commands requiring gas price will pull the
# minimum gas price of the requested node and
# use with the transaction.
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
