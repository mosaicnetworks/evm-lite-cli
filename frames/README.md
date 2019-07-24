# Frames

Define a framework or sdk of somesort allowing developers of the Monet Hub to rapidly write CLIs for thier smart-contracts. But also has to allow for consumers of those smart contracts to easily access these CLIs.

We could allow people to write their own commands using the `Session` and `Staging` classes,for purpose of explaination lets call the smart-contract Keybase, then publish the modules for Keybase in a database like NPM but hosted on the Monet Hub or servers.

Then `monet` can use a command to install the Keybase commands

```bash
$ monet add keybase
```

Now `monet` can interact with the Keybase smart-contract.
