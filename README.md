# EVM-Lite CLI

**_This project is under active development_**

A Command Line Interface to interact with EVM-Lite.

## Breaking Changes

### `poa nominate`

No longer takes argument `--pwd` to be a plaintext passphrase. It now expects to receive a path to a passphrase file which is consistent with other CLI commands.
