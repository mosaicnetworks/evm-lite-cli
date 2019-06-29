# EVM-Lite CLI

**_This project is under active development_**

A Command Line Interface to interact with EVM-Lite.

## Installation

Simply run (_This will also transpile typescript files_)

```bash
npm install
```

then

```
npm link
```

You should now be able to run

Debug mode will display useful information for debugging.

You can enter into interactive mode with `--debug` or `-d` for debugging information for all commands or use the flag `--debug` or `-d` with any command.

```console
$ evmlc i --debug

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
    accounts update [options] [address]  Update passphrase for a local account.
    config view [options]                Output current configuration file
    config set [options]                 Set values of the configuration inside the data directory.
    poa check [options] [address]        Check whether an address is on the whitelist
    poa whitelist [options]              List whitelist entries for a connected node
    poa nomineelist [options]            List nominees for the connected node
    poa nominate [options] [address]     Nominate an address to proceed to election
    poa vote [options] [address]         Vote for an nominee currently in election.
    clear                                Clears interactive mode console output.
    info [options]                       Displays information about node
    version                              Creates an encrypted keypair locally.
    transfer [options]                   Initiate a transfer of token(s) to an address. Default values for gas and gas prices are set in the configuration file.
```
