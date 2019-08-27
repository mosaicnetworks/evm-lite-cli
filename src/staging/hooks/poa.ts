import { Args } from 'vorpal';

import { IAbstractConsensus } from 'evm-lite-consensus';
import {
	Contract,
	IAbstractSchema,
	ITransaction,
	Transaction
} from 'evm-lite-core';

import Session from '../../Session';
import Staging, { IOptions } from '../Staging';

import { EVM_LITE } from '../../errors/generals';

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

export interface IPOAHooks {
	contract: () => Promise<Contract<Schema>>;
}

export default function<
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): IPOAHooks {
	return {
		contract: contract.bind(null, staging, session)
	};
}

export const contract = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): Promise<Contract<Schema>> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(`Attempting to fetch PoA data...`);

	try {
		const poa = await session.POA();
		return Contract.load<Schema>(poa.abi, poa.address);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.toString()));
	}
};
