import { Args } from 'vorpal';

import Account from 'evm-lite-account';
import Transaction from 'evm-lite-transaction';

import { IReceipt } from 'evm-lite-client';

import Frames, { IOptions } from './Frames';

import { EVM_LITE } from '../errors/generals';

export interface ITransactionFrames {
	send: (tx: Transaction, account: Account) => Promise<IReceipt>;
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
): Promise<IReceipt> => {
	const { debug, error } = frames.staging();

	debug(JSON.stringify(tx));
	debug(`Attempting to send transaction...`);

	try {
		const receipt = await frames.session.node.sendTx(tx, account);

		debug(JSON.stringify(receipt));

		return receipt;
	} catch (e) {
		console.log(e);
		return Promise.reject(error(EVM_LITE, e.text || e.toString().trim()));
	}
};

const call = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	tx: Transaction
): Promise<any> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to call transaction...`);

	try {
		return await frames.session.node.callTx<boolean>(tx);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.text || e.toString().trim()));
	}
};
