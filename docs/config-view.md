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

```bash
$ evmlc config view

[connection]
host = "127.0.0.1"
port = 8080

[defaults]
from = "0x274e3fd5b0f09cff74c6ee187e42da127f9deb96"
gas = 123123123123
gasPrice = 0
```
