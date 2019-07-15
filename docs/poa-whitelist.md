[Overview](README.md) / `poa whitelist`

---

# `poa whitelist`

List the whitelist of the `Proof of Authority` contract.

_*Requires a valid connection*_

## Usage

```bash
  Usage: poa whitelist [options]

  Alias: p wl

  List whitelist entries for a connected node

  Options:

    --help             output usage information
    -d, --debug        show debug output
    -f, --formatted    format output
    --from <address>   from address
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

```bash
$ evmlc poa whitelist -f

.------------------------------------------------------.
| Moniker |                  Address                   |
|---------|--------------------------------------------|
| Node1   | 0x07ba865451d9417714e8bb89e715acbc789a1bb7 |
'------------------------------------------------------'

```
