import { Args } from 'vorpal';

import { Contract, AbstractSchema, Transaction, TX } from 'evm-lite-core';

import Frames, { IOptions } from './Frames';

import { EVM_LITE } from '../errors/generals';

interface Schema extends AbstractSchema {
	checkAuthorised(tx: TX, address: string): Transaction;
	submitNominee(tx: TX, address: string, moniker: string): Transaction;
	castNomineeVote(tx: TX, address: string, verdict: boolean): Transaction;
	getCurrentNomineeVotes(tx: TX, address: string): Transaction;
	getWhiteListCount(tx: TX): Transaction;
	getWhiteListAddressFromIdx(tx: TX, id: number): Transaction;
	getMoniker(tx: TX, address: string): Transaction;
	getNomineeCount(tx: TX): Transaction;
	getNomineeAddressFromIdx(tx: TX, id: number): Transaction;
	isNominee(tx: TX, address: string): Transaction;
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
