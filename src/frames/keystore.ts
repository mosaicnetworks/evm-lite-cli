import { Args } from 'vorpal';

import Account from 'evm-lite-account';
import {
	AbstractKeystore,
	IMonikerKeystore,
	IV3Keyfile
} from 'evm-lite-keystore';

import Frames, { IOptions } from './Frames';

import { KEYSTORE } from '../errors/generals';

export interface IKeystoreFrames {
	list: () => Promise<IMonikerKeystore>;
	get: (address: string) => Promise<IV3Keyfile>;
	decrypt: (keyfile: IV3Keyfile, password: string) => Promise<Account>;
}

export default <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>
): IKeystoreFrames => {
	return {
		list: list.bind(null, frames),
		get: get.bind(null, frames),
		decrypt: decrypt.bind(null, frames)
	};
};

const list = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>
): Promise<IMonikerKeystore> => {
	const { debug, error } = frames.staging();

	debug(`Keystore path: ${frames.session.datadir.keystorePath}`);
	debug(`Attempting to fetch accounts from keystore...`);

	try {
		const mapping = await frames.session.datadir.listKeyfiles();

		if (!Object.keys(mapping).length) {
			return Promise.reject(
				error(
					KEYSTORE.EMPTY,
					`No accounts found in keystore '${
						frames.session.datadir.keystorePath
					}'`
				)
			);
		}

		return mapping;
	} catch (e) {
		return Promise.reject(error(KEYSTORE.LIST, e.toString()));
	}
};

const get = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	moniker: string
): Promise<IV3Keyfile> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to fetch keystore for address...`);

	try {
		return await frames.session.datadir.getKeyfile(moniker);
	} catch (e) {
		return Promise.reject(
			error(
				KEYSTORE.FETCH,
				`Could not locate keystore for address '${moniker}' in '${
					frames.session.datadir.keystorePath
				}'`
			)
		);
	}
};

const decrypt = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	keyfile: IV3Keyfile,
	passphrase: string
): Promise<Account> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to decrypt keystore...`);

	try {
		return AbstractKeystore.decrypt(keyfile, passphrase);
	} catch (err) {
		return Promise.reject(
			error(
				KEYSTORE.DECRYPTION,
				'Cannot decrypt account with passphrase provided.'
			)
		);
	}
};
