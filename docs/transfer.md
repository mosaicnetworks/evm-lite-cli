[Overview](README.md) / `transfer`

---

# `transfer`

Transfer tokens from one account to another.

_*A valid connection is required.*_

## Usage

```bash
  Usage: transfer [options]

  Alias: t

  Initiate a transfer of token(s) to an address

  Options:

    --help                   output usage information
    -i, --interactive        enter interactive mode
    -d, --debug              show debug output
    -v, --value <value>      value to send
    -g, --gas <value>        gas
    -gp, --gasprice <value>  gas price
    -t, --to <address>       send to address
    -f, --from <address>     send from address
    --pwd <password>         passphrase file path
    -h, --host <ip>          override config host value
    -p, --port <port>        override config port value
```

## Example

```bash
$ evmlc transfer -f 702b0ad02a7a6056eb16a697a96d849c228f5fb4 -t 4f6ed4bfd7b4acd24c7d8130b7df0b6f78880048 -v 100 -g 1000000000 -gp 0 --pwd /home/jake/pwd.txt

Transaction submitted successfully.
```
