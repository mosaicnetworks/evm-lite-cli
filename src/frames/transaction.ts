import { Args } from 'vorpal';

import { Transaction, TransactionReceipt, Account } from 'evm-lite-core';

import Frames, { IOptions } from './Frames';

import { EVM_LITE } from '../errors/generals';

export interface ITransactionFrames {
	send: (tx: Transaction, account: Account) => Promise<TransactionReceipt>;
	call: <Response>(tx: Transaction) => Promise<Response>;
}

export default <A extends Args<IOptions>, F, N>(
	frame: Frames<A, F, N>
): ITransactionFrames => {
	return {
		send: send.bind(null, frame),
		call: call.bind(null, frame)
	};
};

const send = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	tx: Transaction,
	account: Account
): Promise<TransactionReceipt> => {
	const { debug, error } = frames.staging();

	debug(JSON.stringify(tx));
	debug(`Attempting to send transaction...`);

	try {
		const receipt = await frames.session.node.sendTransaction(tx, account);

		debug(JSON.stringify(receipt));

		return receipt;
	} catch (e) {
		const err = typeof e === 'object' ? e.text : e.toString().trim();

		return Promise.reject(error(EVM_LITE, err));
	}
};

const call = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	tx: Transaction
): Promise<any> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to call transaction...`);

	try {
		return await frames.session.node.callTransaction<boolean>(tx);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.text));
	}
};