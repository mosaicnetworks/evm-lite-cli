[Overview](README.md) / `poa nominate`

---

# `poa nominate`

Nominate a new validator.

_*Requires a valid connection*_

## Usage

```bash
  Usage: poa nominate [options] [address]

  Alias: p n

  Nominate an address to proceed to election

  Options:

    --help               output usage information
    -i, --interactive    interactive
    -d, --debug          show debug output
    --pwd <password>     passphase file path
    --moniker <moniker>  moniker of the nominee
    --from <moniker>     from moniker
    -h, --host <ip>      override config host value
    -p, --port <port>    override config port value
```

## Example

```bash
$ evmlc poa nominate 0x702b0ad02a7a6056eb16a697a96d849c228f5fb4 --from moniker --pwd /home/jake/pwd.txt --moniker node2

Successfully nominated
```
