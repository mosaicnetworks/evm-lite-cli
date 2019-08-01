# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

### Changed

## 1.0.0-alpha.22

### Added

### Changed

-   `transfer` now lists accounts in interactive mode with balances formatted nicely

*   `accounts create` now takes an argument `moniker` to be used as the file name of the created keyfile
*   `accounts list` now lists accounts with moniker
*   `accounts update` now accepts a `moniker` as the argument to reference an account
*   `config set` default `from` field now only accepts monikers that exist in the default keystore for the application
*   All `payable` transactions now list `monikers` as the `from` attribute.

## 1.0.0-alpha.21

### Added

-   `debug, d` command to toggle in and out of debug mode in interactive

### Changed

-   Error handling for `poa init` when ran out of gas or if no logs are returned.
-   Converted staging classes into a more generic wrapper which has access to utlity functions (`Frames`)
