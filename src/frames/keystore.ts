import { Args } from 'vorpal';

import { Account } from 'evm-lite-core';
import { V3Keyfile, Keystore, MonikerKeystore } from 'evm-lite-keystore';

import Frames, { IOptions } from './Frames';

import { KEYSTORE } from '../errors/generals';

export interface IKeystoreFrames {
	list: () => Promise<MonikerKeystore>;
	get: (address: string) => Promise<V3Keyfile>;
	decrypt: (keyfile: V3Keyfile, password: string) => Promise<Account>;
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
): Promise<MonikerKeystore> => {
	const { debug, error } = frames.staging();

	debug(`Keystore path: ${frames.session.keystore.path}`);
	debug(`Attempting to fetch accounts from keystore...`);

	try {
		const mapping = await frames.session.keystore.list();

		if (!Object.keys(mapping).length) {
			return Promise.reject(
				error(
					KEYSTORE.EMPTY,
					`No accounts found in keystore '${
						frames.session.keystore.path
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
): Promise<V3Keyfile> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to fetch keystore for address...`);

	try {
		return await frames.session.keystore.get(moniker);
	} catch (e) {
		return Promise.reject(
			error(
				KEYSTORE.FETCH,
				`Could not locate keystore for address '${moniker}' in '${
					frames.session.keystore.path
				}'`
			)
		);
	}
};

const decrypt = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	keyfile: V3Keyfile,
	passphrase: string
): Promise<Account> => {
	const { debug, error } = frames.staging();

	debug(`Attempting to decrypt keystore...`);

	try {
		return Keystore.decrypt(keyfile, passphrase);
	} catch (err) {
		return Promise.reject(
			error(
				KEYSTORE.DECRYPTION,
				'Cannot decrypt account with passphrase provided.'
			)
		);
	}
};
