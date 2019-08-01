[Overview](README.md) / `poa vote`

---

# `poa vote`

Vote for a nominee on the `Proof of Authrity` contract.

_*Requires a valid connection*_

## Usage

```bash
  Usage: poa vote [options] [address]

  Alias: p v

  Vote for an nominee currently in election

  Options:

    --help               output usage information
    -i, --interactive    interactive
    -d, --debug          show debug output
    --verdict <boolean>  verdict for given address
    --pwd <password>     passphrase file path
    --from <moniker>     from moniker
    -h, --host <ip>      override config host value
    -p, --port <port>    override config port value
```

## Example

```bash
$ evmlc poa vote 0x702b0ad02a7a6056eb16a697a96d849c228f5fb4  --from moniker --pwd /home/jake/pwd.txt --verdict true

You (0x07ba865451d9417714e8bb89e715acbc789a1bb7) voted 'Yes' for '0x702b0ad02a7a6056eb16a697a96d849c228f5fb4'.
```
