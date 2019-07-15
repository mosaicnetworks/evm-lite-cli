[Overview](README.md) / `poa nomineelist`

---

# `poa nomineelist`

List the nominee list of the `Proof of Authority` contract.

_*Requires a valid connection*_

## Usage

```bash
  Usage: poa nomineelist [options]

  Alias: p nl

  List nominees for a connected node

  Options:

    --help             output usage information
    -d, --debug        show debug output
    -f, --formatted    format output
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

```bash
$ evmlc poa nomineelist -f

.------------------------------------------------------.
| Moniker |                  Address                   |
|---------|--------------------------------------------|
| Node2   | 0x702b0ad02a7a6056eb16a697a96d849c228f5fb4 |
'------------------------------------------------------'
```
