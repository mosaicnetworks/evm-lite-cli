import { AbstractSchema, Transaction, TX } from 'evm-lite-core';

export interface Schema extends AbstractSchema {
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
