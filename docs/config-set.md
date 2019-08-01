[Overview](README.md) / `config set`

---

# `config set`

Update config values.

## Usage

```bash
  Usage: config set [options]

  Alias: c s

  Set values of the configuration inside the data directory

  Options:

    --help                 output usage information
    -i, --interactive      enter interactive mode
    -h, --host <host>      default host
    -p, --port <port>      default port
    --from <moniker>       default from moniker
    --gas <gas>            default gas
    --gasprice <gasprice>  gas price
```

## Example

```toml
$ evmlc config set --gas 100100100

[connection]
host = "127.0.0.1"
port = 8080

[defaults]
from = "danu"
gas = 100100100
gasPrice = 0

Configuration saved
```
