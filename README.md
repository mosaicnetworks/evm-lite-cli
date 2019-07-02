# EVM-Lite CLI

**_This project is under active development_**

A Command Line Interface to interact with EVM-Lite.

## Installation

Simply run (_This will also transpile typescript files_)

```bash
npm install
```

then
(_This command is to make sure that an existing `evmlc` build is not ovewritten while testing this branch._)

```console
$ npm run i

  _______     ____  __       _     _ _          ____ _     ___
 | ____\ \   / /  \/  |     | |   (_) |_ ___   / ___| |   |_ _|
 |  _|  \ \ / /| |\/| |_____| |   | | __/ _ \ | |   | |    | |
 | |___  \ V / | |  | |_____| |___| | ||  __/ | |___| |___ | |
 |_____|  \_/  |_|  |_|     |_____|_|\__\___|  \____|_____|___|

 Debug:       True
 Mode:        Interactive
 Data Dir:    /Users/danu/.evmlc
 Config File: /Users/danu/.evmlc/config.toml
 Keystore:    /Users/danu/.evmlc/keystore

  Commands:

    help [command...]                    Provides help for a given command.
    exit                                 Exits application.
    accounts create [options]            Creates an encrypted keypair locally
    accounts get [options] [address]     Fetches account details from a connected node
    accounts list [options]              List all accounts in the local keystore directory
    accounts update [options] [address]  Update passphrase for a local account
    config view [options]                Output current configuration file
    config set [options]                 Set values of the configuration inside the data directory
    poa check [options] [address]        Check whether an address is on the whitelist
    poa whitelist [options]              List whitelist entries for a connected node
    poa nomineelist [options]            List nominees for the connected node
    poa nominate [options] [address]     Nominate an address to proceed to election
    poa vote [options] [address]         Vote for an nominee currently in election
    poa info [options]                   Display Proof of Authority information
    clear                                Clears interactive mode console output
    info [options]                       Displays information about node
    version                              Displays current version of cli
    transfer [options]                   Initiate a transfer of token(s) to an address
```
