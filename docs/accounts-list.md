[Overview](README.md) / `accounts list`

---

# `accounts list`

List all accounts in the `keystore` or all controlled accounts. If there is a valid connection to a node, the `balance`, `nonce` and `bytecode` will be fetched and displayed.

## Usage

```bash
  Usage: accounts list [options]

  Alias: a l

  List all accounts in the local keystore directory

  Options:

    --help             output usage information
    -f, --formatted    format output
    -r, --remote       list remote accounts
    -d, --debug        show debug output
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

### Local Keystore

```bash
$ evmlc accounts list --host 127.0.0.1 --port 8080

[{"address":"0x702B0ad02a7a6056EB16A697A96d849c228F5fB4","balance":100,"nonce":0,"bytecode":""}]
```

### Remote

```bash
$ evmlc accounts list -r --host 127.0.0.1 --port 8080

[{"address":"0x702B0ad02a7a6056EB16A697A96d849c228F5fB4","balance":12300000,"nonce":0,"bytecode":""}]
```
