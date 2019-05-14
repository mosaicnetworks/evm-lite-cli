# Proof of Authority Commands

## Setup

To begin testing these commands you will need to set defaults.

Run the following command and set each of the configuration attributes to the
desired values.

```bash
evmlc config set -i

? Host 127.0.0.1
? Port 8080
? From 0xA4a5F65Fb3752b2B6632F2729f17dd61B2aaD650
? Gas 100000000
? Gas Price 0
? Keystore [home_dir]/.evmlc/keystore
```

The default `from` address will be the account used to sign transactions for any
POA commands.

The `keystore` directory must contrain the associated `keystore` for the
defualt `from` address.

