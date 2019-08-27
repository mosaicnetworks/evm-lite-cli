import * as nodepath from 'path';

import { IAbstractConsensus } from 'evm-lite-consensus';

import Utils from 'evm-lite-utils';

import DataDirectory from 'evm-lite-datadir';
import Keystore from 'evm-lite-keystore';

import Node from 'evm-lite-core';

import { IContractABI } from 'evm-lite-client';

export default class Session<TConsensus extends IAbstractConsensus> {
	public interactive: boolean = false;
	public debug: boolean = false;

	public node: Node<TConsensus>;
	public datadir: DataDirectory<Keystore>;

	constructor(
		path: string,
		configName: string,
		public readonly concls: new (host: string, port: number) => TConsensus
	) {
		const keystore = new Keystore(nodepath.join(path, 'keystore'));

		this.node = new Node('localhost', 8080, new concls('127.0.0.1', 8080));
		this.datadir = new DataDirectory(path, configName, keystore);
	}

	public async POA(): Promise<{
		address: string;
		abi: IContractABI;
	}> {
		if (process.env.DEBUG) {
			return {
				address: Utils.trimHex(process.env.CONTRACT_ADDRESS!),
				abi: JSON.parse(process.env.CONTRACT_ABI!)
			};
		}

		const poa = await this.node.getPOA();

		return {
			...poa,
			// TODO: Perhaps find a fix for the double parsing due
			// to escaped strings
			// @ts-ignore
			abi: JSON.parse(poa.abi as string)
		};
	}

	public async connect(
		forcedHost?: string,
		forcedPort?: number
	): Promise<boolean> {
		const config = this.datadir.config;

		const host: string =
			forcedHost || config.connection.host || '127.0.0.1';
		const port: number = forcedPort || config.connection.port || 8080;

		const consensus = new this.concls(host, port);
		const node = new Node(host, port, consensus);

		try {
			await node.getInfo();

			this.node = node;

			return Promise.resolve(true);
		} catch (e) {
			return Promise.resolve(false);
		}
	}
}
