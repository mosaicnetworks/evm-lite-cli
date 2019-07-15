[Overview](README.md) / `poa check`

---

# `poa check`

Check whether an `address` is whitelisted.

_*Requires a valid connection*_

## Usage

```bash
  Usage: poa check [options] [address]

  Alias: p c

  Check whether an address is on the whitelist

  Options:

    --help             output usage information
    -i, --interactive  enter interactive
    -d, --debug        show debug output
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

```bash
$ evmlc poa check 0x702B0ad02a7a6056EB16A697A96d849c228F5fB4

Yes
```
