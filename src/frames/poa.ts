import { Args } from 'vorpal';

import Contract, { IAbstractSchema } from 'evm-lite-contract';
import Transaction, { ITransaction } from 'evm-lite-transaction';

import Frames, { IOptions } from './Frames';

import { EVM_LITE } from '../errors/generals';

interface Schema extends IAbstractSchema {
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

export interface IPOAFrames {
	contract: () => Promise<Contract<Schema>>;
}

export default <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>
): IPOAFrames => {
	return {
		contract: contract.bind(null, frames)
	};
};

export const contract = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>
): Promise<Contract<Schema>> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to fetch PoA data...`);

	try {
		const poa = await frames.session.getPOAContract();
		return Contract.load<Schema>(poa.abi, poa.address);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.toString()));
	}
};
