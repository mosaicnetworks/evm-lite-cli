import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import utils from 'evm-lite-utils';

import Session from '../core/Session';
import Table from '../core/Table';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	formatted?: boolean;

	host: string;
	port: number;
	gas: number;
};

type Args = Arguments<Opts> & {};

export type NomineeEntry = {
	address: string;
	moniker: string;
	upVotes: number;
	downVotes: number;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'List nominees for a connected node';

	return evmlc
		.command('poa nominee list')
		.alias('p n l')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('--gas <g>', 'override config gas value')
		.types({
			string: ['host', 'h']
		})
		.action((args: Args) => new POANomineeListCommand(session, args).run());
};

class POANomineeListCommand extends Command<Args> {
	public async getNomineeList() {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/poa`
		);

		const poa = await this.node!.getPOA();

		this.log.info('POA', poa.address);

		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		const transaction = contract.methods.getNomineeCount({
			gas: this.args.options.gas,
			gasPrice: Number(this.args.options.gasPrice)
		});

		const countRes: any = await this.node!.callTx(transaction);
		const count = countRes.toNumber();
		this.debug(`Nominee count -> ${count}`);

		const entries: NomineeEntry[] = [];

		for (const i of Array.from(Array(count).keys())) {
			const entry: NomineeEntry = {
				address: '',
				moniker: '',
				upVotes: 0,
				downVotes: 0
			};

			const addressTx = contract.methods.getNomineeAddressFromIdx(
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

			const votesTx = contract.methods.getCurrentNomineeVotes(
				{
					gas: this.args.options.gas,
					gasPrice: Number(this.args.options.gasPrice)
				},
				utils.cleanAddress(entry.address)
			);

			const votes = await this.node!.callTx<[string, string]>(votesTx);

			entry.upVotes = parseInt(votes[0], 10);
			entry.downVotes = parseInt(votes[1], 10);

			this.debug(
				`Adding nominee -> ${entry.moniker} (${entry.address}) [${entry.upVotes}, ${entry.downVotes}]`
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
		const entries = await this.getNomineeList();
		const table = new Table([
			'Moniker',
			'Address',
			'Up Votes',
			'Down Votes'
		]);

		if (!this.args.options.formatted && !this.session.interactive) {
			return JSON.stringify(entries, null, 2);
		}

		for (const entry of entries) {
			table.push([
				entry.moniker,
				entry.address,
				entry.upVotes,
				entry.downVotes
			]);
		}

		return table.toString();
	}
}

export const POANomineeList = POANomineeListCommand;
