# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.2.1

### Changed

-   `--silent` now silences all logging including error, `--error` sets logging level to error and `--debug` shows debugging logs
-   Cleaned up prompts for POA commands to be more coherent
-   `--datadir, -d` added to `help` to showcase how to change data directory

## v1.2.0

### Added

-   `TxCommand` class hold transactional command abstractions

### Changed

-   All transaction commands now use `TxCommand` class
-   `gasPrice` has been removed from all commands due to it being redundant

## v1.1.1

-   core: `Command` class now has `.startSprinner(text: string)` and `.stopSpinner`
-   core: Added `Command.test()` to be used in testing rather than `.run()`
-   core: `Command.exec` now returns a string to be parsed by `.run()`
-   Now exporting default table styling class `Table` for EVMLC to be used by extentions

## v1.1.0

All commands now have a more coherent structure and error handling.
