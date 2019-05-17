# Proof of Authority Commands

## Setup

The contract address can be set in `src/commands/POA/other/constants.ts`.

```
$ evmlc poa

  Commands:

    poa nominate [options]             Allows you to nominate an address to go through election
    poa vote [options]                 Allows you to vote for an address.
    poa check [options] [address]      Allows you to check whether a nominee was accepted
    poa isnominee [options] [address]  Checks whether an address is a nominee
    poa show [options] [address]       Shows the number of yes and no votes
```
