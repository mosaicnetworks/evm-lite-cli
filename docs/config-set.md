[Overview](README.md) / `config view`

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
    --from <from>          default from
    --gas <gas>            default gas
    --gasprice <gasprice>  gas price
```

## Example

```bash
$ evmlc config set --gas 100100100

[connection]
host = "127.0.0.1"
port = 8080

[defaults]
from = "0x274e3fd5b0f09cff74c6ee187e42da127f9deb96"
gas = 100100100
gasPrice = 0

Configuration saved
```
