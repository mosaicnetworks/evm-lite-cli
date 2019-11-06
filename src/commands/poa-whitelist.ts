import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import utils from 'evm-lite-utils';

import Session from '../core/Session';
import Table from '../core/Table';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	host: string;
	port: number;
	gas: number;
};

type Args = Arguments<Opts> & {};

export type WhitelistEntry = {
	address: string;
	moniker: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'List whitelist entries for a connected node';

	return evmlc
		.command('poa whitelist')
		.alias('p wl')
		.description(description)
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('--gas <g>', 'override config gas value')
		.types({
			string: ['host', 'h']
		})
		.action(
			(args: Args): Promise<void> =>
				new POAWhitelistCommand(session, args).run()
		);
};

class POAWhitelistCommand extends Command<Args> {
	public async getWhitelist() {
		const poa = await this.node!.getPOA();

		this.log.info('POA', poa.address);

		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		const transaction = contract.methods.getWhiteListCount({
			gas: this.args.options.gas,
			gasPrice: Number(this.args.options.gasPrice)
		});

		const countRes: any = await this.node!.callTx(transaction);
		const count = countRes.toNumber();
		this.debug(`Whitelist count -> ${count}`);

		if (!count) {
			return [];
		}

		// entries
		const entries: WhitelistEntry[] = [];

		for (const i of Array.from(Array(count).keys())) {
			const entry: WhitelistEntry = {
				address: '',
				moniker: ''
			};

			const addressTx = contract.methods.getWhiteListAddressFromIdx(
				{
					gas: this.args.options.gas,
					gasPrice: Number(this.args.options.gasPrice)
				},
				i
			);

			entry.address = await this.node!.callTx(addressTx);

			const monikerTx = contract.methods.getMoniker(
				{
					gas: this.args.options.gas,
					gasPrice: Number(this.args.options.gasPrice)
				},
				entry.address
			);

			const hex = await this.node!.callTx<string>(monikerTx);
			entry.moniker = utils.hexToString(hex);

			this.debug(
				`Adding whitelist entry -> ${entry.moniker} (${entry.address})`
			);

			entries.push(entry);
		}

		return entries;
	}

	public async init(): Promise<boolean> {
		this.constant = true;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		this.node = new Node(this.args.options.host, this.args.options.port);

		return false;
	}

	protected async prompt(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/poa`
		);

		const entries = (await this.getWhitelist()) as WhitelistEntry[];
		const table = new Table(['Moniker', 'Address']);

		if (!entries.length) {
			return 'No whitelist entries found';
		}

		for (const entry of entries) {
			table.push([entry.moniker, entry.address]);
		}

		if (this.args.options.json) {
			return JSON.stringify(entries);
		} else {
			return table.toString();
		}
	}
}

export const POAWhitelist = POAWhitelistCommand;
