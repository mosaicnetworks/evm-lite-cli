[Overview](README.md) / `accounts get`

---

# `accounts get`

Fetches `balance`, `nonce` and `bytecode` of an account from a connected node.

## Usage

```bash
  Usage: accounts get [options] [address]

  Alias: a g

  Fetches account details from a connected node

  Options:

    --help             output usage information
    -f, --formatted    format output
    -i, --interactive  enter interactive mode
    -d, --debug        show debug output
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

```bash
$ accounts get 0x702B0ad02a7a6056EB16A697A96d849c228F5fB4 --host 127.0.0.1 --port 8080

{"address":"0x702B0ad02a7a6056EB16A697A96d849c228F5fB4","balance":100,"nonce":0,"bytecode":""}
```
