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

.------------------------------------------------------------------------------.
| Moniker |                  Address                   | Up Votes | Down Votes |
|---------|--------------------------------------------|----------|------------|
| node1   | 0xccf722f63e1f39a02d6a8676f0082d55a9f92c8e |        0 |          0 |
'------------------------------------------------------------------------------'
```
