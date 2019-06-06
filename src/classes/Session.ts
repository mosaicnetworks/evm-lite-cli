import * as nodepath from 'path';

import { EVMLC } from 'evm-lite-core';
import { DataDirectory } from 'evm-lite-datadirectory';
import { Keystore } from 'evm-lite-keystore';

export default class Session {
	public interactive: boolean = false;

	public directory: DataDirectory<Keystore>;
	public node: EVMLC = null;

	constructor(path: string) {
		const keystore = new Keystore(nodepath.join(path, 'keystore'));

		this.directory = new DataDirectory(path);
		this.directory.setKeystore(keystore);
	}

	get keystore() {
		return this.directory.keystore;
	}

	get config() {
		return this.directory.config;
	}

	public async connect(
		forcedHost?: string,
		forcedPort?: number
	): Promise<EVMLC> {
		const { state } = this.directory.config;

		const host: string = forcedHost || state.connection.host || '127.0.0.1';
		const port: number = forcedPort || state.connection.port || 8080;
		const node = new EVMLC(host, port);

		try {
			await node.getInfo();

			if (
				this.node &&
				this.node.host === host &&
				this.node.port === port
			) {
				return this.node;
			}
			if (!forcedHost && !forcedPort) {
				this.node = node;
			}

			return node;
		} catch (e) {
			Promise.reject(new Error('Could not connect to node.'));
			return null;
		}
	}
}
