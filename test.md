Turns out the EVM only calculates the `intrinsic gas` based on the bytes provided in the data attribute of the transaction.

So for `poa init` the transaction

```json
{
	"from": "0e807fd924fd52574226b6e7f68614662c21e509",
	"to": "abbaabbaabbaabbaabbaabbaabbaabbaabbaabba",
	"value": 0,
	"data": "e1c7392a",
	"gas": 21272,
	"gasPrice": 0,
	"chainId": 1
}
```

with a `data` attribute of `e1c7392a`. This is calculated by a `sha3` hash then sliced to 8 characters.

The byte equivilant of `e1c7392a` is `[225, 199, 57, 42]`.

The intrinsic gas default all transactions is `21000` plus gas depending on how many non-zero and zero bytes there are.

So in our case we have 4 non-zero bytes and they are worth `68` gas each leaving us a total of

```
21000 + (4 * 68) = 21272
```

If we run `poa init` with 21271 `gas` it will error with

```json
{
	"from": "0e807fd924fd52574226b6e7f68614662c21e509",
	"to": "abbaabbaabbaabbaabbaabbaabbaabbaabbaabba",
	"value": 0,
	"data": "e1c7392a",
	"gas": 21271,
	"gasPrice": 0,
	"chainId": 1
}

EVM-Lite: Out of Gas
```

but with 21272 it will not throw an error but instead use all the gas.

**Transaction**

```json
{
	"from": "0e807fd924fd52574226b6e7f68614662c21e509",
	"to": "abbaabbaabbaabbaabbaabbaabbaabbaabbaabba",
	"value": 0,
	"data": "e1c7392a",
	"gas": 21272,
	"gasPrice": 0,
	"chainId": 1
}
```

**Receipt**

```json
{
	"root": "0x0ce36dae0a0f5fbf4b384c51715151d9e31d86458c4e1c9d767c4232dea50e14",
	"transactionHash": "0xf9e06a07b48bd47d2eafdfde0361d397f94cb31558ccff1aea527026111153d1",
	"from": "0x0e807fd924fd52574226b6e7f68614662c21e509",
	"to": "0xabbaabbaabbaabbaabbaabbaabbaabbaabbaabba",
	"gasUsed": 21272,
	"cumulativeGasUsed": 21272,
	"contractAddress": "0x0000000000000000000000000000000000000000",
	"logs": [],
	"logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
	"status": 0
}
```
