[Overview](README.md) / `accounts update`

---

# `accounts update`

Updates the passphrase for an encrypted keyfile if current passphrase is known.

## Usage

```bash
  Usage: accounts update [options] [moniker]

  Alias: a u

  Update passphrase for a local account

  Options:

    --help             output usage information
    -i, --interactive  enter interactive mode
    -d, --debug        show debug output
    -o, --old <path>   old passphrase file path
    -n, --new <path>   new passphrase file path
```

## Example

```bash
$ evmlc accounts update danu --old /home/jake/old_pwd.txt --new /home/jake/new_pwd.txt

{"version":3,"id":"bbe7bb5d-2381-4621-b970-c81ca12b2e1b","address":"702b0ad02a7a6056eb16a697a96d849c228f5fb4","crypto":{"ciphertext":"7aaa32c2a8446995433081b9ba0748d828fde46c8679970ddcee98b3534bec1e","cipherparams":{"iv":"d4b8a589acf91226211dde8899a43aba"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"9fae8462d246a103adcd61bdbc5d2a04aeae1ca0a5f03fa99257f05cb2058a28","n":8192,"r":8,"p":1},"mac":"29f7ed78f970114f42569e1d661c4accd2cfd5a6c82aa0384f2231b36d2d0ada"}}
```
