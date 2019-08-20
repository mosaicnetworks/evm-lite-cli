import { Args } from 'vorpal';

import { IAbstractConsensus } from 'evm-lite-solo';

import Account from 'evm-lite-account';
import Transaction from 'evm-lite-transaction';

import { IReceipt } from 'evm-lite-client';

import Session from '../../Session';
import Staging, { IOptions } from '../Staging';

import { EVM_LITE } from '../../errors/generals';

export interface ITxHooks {
	send: (tx: Transaction, account: Account) => Promise<IReceipt>;
	call: <Response>(tx: Transaction) => Promise<Response>;
}

export default function<
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): ITxHooks {
	return {
		send: send.bind(null, staging, session),
		call: call.bind(null, staging, session)
	};
}

const send = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>,
	tx: Transaction,
	account: Account
): Promise<IReceipt> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(JSON.stringify(tx));
	debug(`Attempting to send transaction...`);

	try {
		const receipt = await session.node.sendTx(tx, account);

		debug(JSON.stringify(receipt));

		return receipt;
	} catch (e) {
		console.log(e);
		return Promise.reject(error(EVM_LITE, e.text || e.toString().trim()));
	}
};

const call = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>,
	tx: Transaction
): Promise<any> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(`Attempting to call transaction...`);

	try {
		return await session.node.callTx<boolean>(tx);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.text || e.toString().trim()));
	}
};
