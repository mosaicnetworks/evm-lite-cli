import { Args } from 'vorpal';

import {
	AbstractKeystore,
	IMonikerKeystore,
	IV3Keyfile
} from 'evm-lite-keystore';

import { IAbstractConsensus } from 'evm-lite-consensus';
import { Account } from 'evm-lite-core';

import Session from '../../Session';
import Staging, { IOptions } from '../Staging';

import { KEYSTORE } from '../../errors/generals';

export interface IKeystoreHooks {
	list: () => Promise<IMonikerKeystore>;
	get: (address: string) => Promise<IV3Keyfile>;
	decrypt: (keyfile: IV3Keyfile, password: string) => Promise<Account>;
}

export default function<
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): IKeystoreHooks {
	return {
		list: list.bind(null, staging, session),
		get: get.bind(null, staging, session),
		decrypt: decrypt.bind(null, staging, session)
	};
}

const list = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): Promise<IMonikerKeystore> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(`Keystore path: ${session.datadir.keystorePath}`);
	debug(`Attempting to fetch accounts from keystore...`);

	try {
		const mapping = await session.datadir.listKeyfiles();

		if (!Object.keys(mapping).length) {
			return Promise.reject(
				error(
					KEYSTORE.EMPTY,
					`No accounts found in keystore '${session.datadir.keystorePath}'`
				)
			);
		}

		return mapping;
	} catch (e) {
		return Promise.reject(error(KEYSTORE.LIST, e.toString()));
	}
};

const get = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>,
	moniker: string
): Promise<IV3Keyfile> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(`Attempting to fetch keystore for address...`);

	try {
		return await session.datadir.getKeyfile(moniker);
	} catch (e) {
		return Promise.reject(
			error(
				KEYSTORE.FETCH,
				`Could not locate keystore for address '${moniker}' in '${session.datadir.keystorePath}'`
			)
		);
	}
};

const decrypt = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>,
	keyfile: IV3Keyfile,
	passphrase: string
): Promise<Account> => {
	const { debug, error } = staging.handlers(session.debug);

	debug(`Attempting to decrypt keystore...`);

	try {
		return AbstractKeystore.decrypt(keyfile, passphrase);
	} catch (err) {
		debug(err);
		return Promise.reject(
			error(
				KEYSTORE.DECRYPTION,
				'Cannot decrypt account with passphrase provided.'
			)
		);
	}
};
