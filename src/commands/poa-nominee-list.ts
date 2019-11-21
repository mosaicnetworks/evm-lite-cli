import Vorpal from 'vorpal';

import Node from 'evm-lite-core';

import Session from '../core/Session';
import Table from '../core/Table';
import POA from '../poa/Contract';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
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
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('--gas <g>', 'override config gas value')
		.types({
			string: ['host', 'h']
		})
		.action((args: Args) => new POANomineeListCommand(session, args).run());
};

class POANomineeListCommand extends Command<Args> {
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
		const poa = new POA(this.args.options.host, this.args.options.port);
		await poa.init();

		const entries = await poa.nominees();
		const table = new Table([
			'Moniker',
			'Address',
			'Up Votes',
			'Down Votes'
		]);

		for (const entry of entries) {
			this.debug(
				`Adding nominee -> ${entry.moniker} (${entry.address}) [${entry.upVotes}, ${entry.downVotes}]`
			);

			table.push([
				entry.moniker,
				entry.address,
				entry.upVotes,
				entry.downVotes
			]);
		}

		if (this.args.options.json) {
			return JSON.stringify(entries);
		} else {
			return table.toString();
		}
	}
}

export const POANomineeList = POANomineeListCommand;
