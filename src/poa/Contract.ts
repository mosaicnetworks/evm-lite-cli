import {
	Contract,
	IAbstractSchema,
	ITransaction,
	Monet,
	Transaction
} from 'evm-lite-core';

import utils from 'evm-lite-utils';

const GAS = 10000000;
const GASPRICE = 0;

interface ISchema extends IAbstractSchema {
	checkAuthorised(tx: ITransaction, address: string): Transaction;
	submitNominee(
		tx: ITransaction,
		address: string,
		moniker: string
	): Transaction;
	castNomineeVote(
		tx: ITransaction,
		address: string,
		verdict: boolean
	): Transaction;
	getCurrentNomineeVotes(tx: ITransaction, address: string): Transaction;
	getWhiteListCount(tx: ITransaction): Transaction;
	getWhiteListAddressFromIdx(tx: ITransaction, id: number): Transaction;
	getMoniker(tx: ITransaction, address: string): Transaction;
	getNomineeCount(tx: ITransaction): Transaction;
	getNomineeAddressFromIdx(tx: ITransaction, id: number): Transaction;
	isNominee(tx: ITransaction, address: string): Transaction;
}

export type WhitelistEntry = {
	address: string;
	moniker: string;
};

export type NomineeEntry = {
	address: string;
	moniker: string;
	upVotes: number;
	downVotes: number;
};

export type EvicteeEntry = {
	address: string;
	moniker: string;
	upVotes: number;
	downVotes: number;
};

class POA {
	public readonly monet: Monet;
	public contract?: Contract<ISchema>;

	constructor(host: string, port: number) {
		this.monet = new Monet(host, port);
	}

	public async init() {
		const json = await this.monet.getPOA();
		const abi = json.abi;

		this.contract = new Contract(JSON.parse(abi), json.address);
	}

	public async whitelist(): Promise<WhitelistEntry[]> {
		const countTx = this.contract!.methods.getWhiteListCount({
			gas: GAS,
			gasPrice: GASPRICE
		});

		const countRes: any = await this.monet.callTx(countTx);
		const count = countRes.toNumber();

		if (!count) {
			return [];
		}

		const entries: WhitelistEntry[] = [];

		for (const i of Array.from(Array(count).keys())) {
			const entry: WhitelistEntry = {
				address: '',
				moniker: ''
			};

			const addressTx = this.contract!.methods.getWhiteListAddressFromIdx(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				i
			);

			entry.address = await this.monet.callTx(addressTx);

			const monikerTx = this.contract!.methods.getMoniker(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				entry.address
			);

			const hex = await this.monet.callTx<string>(monikerTx);
			entry.moniker = utils.hexToString(hex);

			entries.push(entry);
		}

		return entries;
	}

	public async nominees(): Promise<NomineeEntry[]> {
		const countTx = this.contract!.methods.getNomineeCount({
			gas: GAS,
			gasPrice: GASPRICE
		});

		const countRes: any = await this.monet.callTx(countTx);
		const count = countRes.toNumber();

		if (!count) {
			return [];
		}

		const entries: NomineeEntry[] = [];
		for (const i of Array.from(Array(count).keys())) {
			const entry: NomineeEntry = {
				address: '',
				moniker: '',
				upVotes: 0,
				downVotes: 0
			};

			const addressTx = this.contract!.methods.getNomineeAddressFromIdx(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				i
			);

			entry.address = await this.monet.callTx(addressTx);

			const monikerTx = this.contract!.methods.getMoniker(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				entry.address
			);

			const hex = await this.monet.callTx<string>(monikerTx);
			entry.moniker = utils.hexToString(hex);

			const votesTx = this.contract!.methods.getCurrentNomineeVotes(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				utils.cleanAddress(entry.address)
			);

			const votes = await this.monet.callTx<[string, string]>(votesTx);

			entry.upVotes = parseInt(votes[0], 10);
			entry.downVotes = parseInt(votes[1], 10);

			entries.push(entry);
		}

		return entries;
	}

	public async evictees(): Promise<EvicteeEntry[]> {
		const transaction = this.contract!.methods.getEvictionCount({
			gas: GAS,
			gasPrice: GASPRICE
		});

		const countRes: any = await this.monet!.callTx(transaction);
		const count = countRes.toNumber();

		const entries: EvicteeEntry[] = [];

		for (const i of Array.from(Array(count).keys())) {
			const entry: EvicteeEntry = {
				address: '',
				moniker: '',
				upVotes: 0,
				downVotes: 0
			};

			const addressTx = this.contract!.methods.getEvictionAddressFromIdx(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				i
			);

			entry.address = await this.monet.callTx(addressTx);

			const monikerTx = this.contract!.methods.getMoniker(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				entry.address
			);

			const hex = await this.monet.callTx<string>(monikerTx);
			entry.moniker = utils.hexToString(hex);

			const votesTx = this.contract!.methods.getCurrentEvictionVotes(
				{
					gas: GAS,
					gasPrice: GASPRICE
				},
				utils.cleanAddress(entry.address)
			);

			const votes = await this.monet.callTx<[string, string]>(votesTx);

			entry.upVotes = parseInt(votes[0], 10);
			entry.downVotes = parseInt(votes[1], 10);

			entries.push(entry);
		}

		return entries;
	}
}

export default POA;
