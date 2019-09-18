import Node from 'evm-lite-core';
import Vorpal from 'vorpal';

import color from '../core/color';
import Session from '../core/Session';
import Table from '../core/Table';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	formatted?: boolean;
	remote?: boolean;
	host?: string;
	port?: number;
	exact?: boolean;
}

export interface Args extends IArgs<Opts> {
	options: Opts;
}

export default (evmlc: Vorpal, session: Session) => {
	const description = 'List all accounts in the local keystore directory';

	return evmlc
		.command('accounts list')
		.alias('a l')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-e, --exact', 'show exact balance')
		.types({
			string: ['h', 'host']
		})
		.action((args: Args) => new AccountListCommand(session, args).run());
};

class AccountListCommand extends Command<Args> {
	public async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.args.options.formatted = this.args.options.formatted || false;

		// set command level node
		this.node = new Node(this.args.options.host!, this.args.options.port);

		return false;
	}

	public async prompt(): Promise<void> {
		return;
	}

	public async check(): Promise<void> {
		return;
	}

	public async exec(): Promise<void> {
		this.log.info('keystore', this.datadir.keystorePath);

		const keystore = await this.datadir.listKeyfiles();

		let accounts: any = Object.keys(keystore).map(moniker => ({
			moniker,
			address: keystore[moniker].address,
			balance: 0,
			nonce: 0,
			bytecode: ''
		}));

		if (!accounts.length) {
			return color.green('[]');
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

		if (!this.args.options.formatted && !this.session.interactive) {
			return color.green(JSON.stringify(accounts));
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

		return color.green(table.toString());
	}
}
