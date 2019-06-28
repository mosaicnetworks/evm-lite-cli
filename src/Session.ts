import * as nodepath from 'path';

import { EVMLC, ContractABI } from 'evm-lite-core';
import { DataDirectory } from 'evm-lite-datadir';
import { Keystore } from 'evm-lite-keystore';

export default class Session {
	public interactive: boolean = false;

	public node: EVMLC = new EVMLC('localhost', 8080);
	public directory: DataDirectory<Keystore>;

	constructor(path: string) {
		const keystore = new Keystore(nodepath.join(path, 'keystore'));

		this.directory = new DataDirectory(path);
		this.directory.setKeystore(keystore);
	}

	get keystore() {
		return this.directory.keystore!;
	}

	get config() {
		return this.directory.config;
	}

	public async getPOAContract(): Promise<{
		address: string;
		abi: ContractABI;
	}> {
		if (process.env.DEBUG) {
			return {
				address: '0xabbaabbaabbaabbaabbaabbaabbaabbaabbaabba',
				abi: JSON.parse(process.env.CONTRACT_ABI!)
			};
		}

		return await this.node.getPOAContract();
	}

	public async connect(
		forcedHost?: string,
		forcedPort?: number
	): Promise<boolean> {
		const { state } = this.directory.config;

		const host: string = forcedHost || state.connection.host || '127.0.0.1';
		const port: number = forcedPort || state.connection.port || 8080;

		const node = new EVMLC(host, port);

		try {
			await node.getInfo();

			this.node = node;

			return Promise.resolve(true);
		} catch (e) {
			return Promise.resolve(false);
		}
	}
}
