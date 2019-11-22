import Node from 'evm-lite-core';
import Vorpal from 'vorpal';

import Session from '../core/Session';
import Table from '../core/Table';

import Command, { Arguments, Options } from '../core/Command';

const terminalImage = require('terminal-image');

type Opts = Options & {
	remote?: boolean;
	host?: string;
	port?: number;
	exact?: boolean;
};

export type Args = Arguments<Opts> & {
	options: Opts;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'List all accounts in the local keystore directory';

	return evmlc
		.command('accounts list')
		.alias('a l')
		.description(description)
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-e, --exact', 'show exact balance')
		.types({
			string: ['h', 'host']
		})
		.action((args: Args) => new AccountListCommand(session, args).run());
};

class AccountListCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		// set command level node
		this.node = new Node(this.args.options.host!, this.args.options.port);

		return false;
	}

	protected async prompt(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		this.log.info('keystore', this.datadir.keystorePath);

		this.debug(`Reading keystore -> ${this.datadir.keystorePath}`);
		const keystore = await this.datadir.listKeyfiles();

		let accounts: any = Object.keys(keystore).map(moniker => ({
			moniker,
			address: keystore[moniker].address,
			balance: 0,
			nonce: 0,
			bytecode: ''
		}));

		if (!accounts.length) {
			return 'No accounts';
		}

		// check connection is valid
		let status: boolean = false;
		try {
			await this.node!.getInfo();
			status = true;
		} catch (e) {
			status = false;
		}

		if (status) {
			this.debug(`Fetching account details from node`);
			this.log.info(
				'node',
				`${this.args.options.host}:${this.args.options.port}`
			);

			const promises = accounts.map(async (acc: any) => {
				const base = await this.node!.getAccount(acc.address);

				return {
					...base,
					moniker: acc.moniker
				};
			});

			accounts = await Promise.all(promises);
		}

		const table = new Table(['Moniker', 'Address', 'Balance', 'Nonce']);

		for (const a of accounts) {
			let balance = a.balance;

			if (status) {
				balance = a.balance.format('T');

				if (!this.args.options.exact) {
					const l = balance.split('.');
					if (l[1]) {
						if (l[1].length > 4) {
							l[1] = l[1].slice(0, 4);

							balance = '~' + l.join('.') + 'T';
						}
					}
				}
			}

			table.push([a.moniker, a.address, balance, a.nonce]);
		}

		if (this.args.options.json) {
			return JSON.stringify(accounts);
		} else {
			return table.toString();
		}
	}
}
