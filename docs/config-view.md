[Overview](README.md) / `config view`

---

# `config view`

View current configuration for `evmlc`.

## Usage

```bash
  Usage: config view [options]

  Alias: c v

  Output current configuration file

  Options:

    --help       output usage information
    -d, --debug  show debug output
```

## Example

```toml
$ evmlc config view

[connection]
host = "127.0.0.1"
port = 8080

[defaults]
from = "danu"
gas = 123123123123
gasPrice = 0
```
