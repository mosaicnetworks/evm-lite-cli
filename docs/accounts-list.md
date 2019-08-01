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
    -d, --debug        show debug output
    -h, --host <ip>    override config host value
    -p, --port <port>  override config port value
```

## Example

### Local Keystore

```javascript
$ evmlc accounts list --host 127.0.0.1 --port 8080

[{"address":"0x0506a62761313EE7A89c5F90664910e639276b7c","balance":0,"nonce":0,"bytecode":"","moniker":"asd"},{"address":"0x901EF614C386dBa6eF5E08162761D384D058311a","balance":"1.23399999999999999965e+21","nonce":10,"bytecode":"","moniker":"danu"},{"address":"0xc67070fD0de4177D70d0322bE93C3015957E94E2","balance":0,"nonce":0,"bytecode":"","moniker":"danu123"},{"address":"0x4c550D459fBac4702b57EF38299B5Bfb945a2E4A","balance":350,"nonce":0,"bytecode":"","moniker":"danu2"},{"address":"0x01c57E38d0F131a00E4e846c9295BF57e8C3de76","balance":0,"nonce":0,"bytecode":"","moniker":"danu3"},{"address":"0x2DB007cd3C7CCa1b3975E224B93D1efb7Be674ba","balance":0,"nonce":0,"bytecode":"","moniker":"danu4"},{"address":"0x7507D67821CfF7171e314Da384f321F893C55e33","balance":0,"nonce":0,"bytecode":"","moniker":"danu6"}]
```
