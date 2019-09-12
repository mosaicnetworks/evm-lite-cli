import Table from 'cli-table';
import Node from 'evm-lite-core';
import Vorpal from 'vorpal';

import color from '../core/color';
import Session from '../core/Session';

import Command, { TArgs, TOptions } from '../core/Command';

interface Opts extends TOptions {
	formatted?: boolean;
	remote?: boolean;
	host?: string;
	port?: number;
}

export interface Args extends TArgs<Opts> {
	options: Opts;
}

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'List all accounts in the local keystore directory';

	return evmlc
		.command('accounts list')
		.alias('a l')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new AccountListCommand(session, args).run()
		);
};

class AccountListCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.args.options.formatted = this.args.options.formatted || false;

		return true;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		this.debug('Does this work');
		const keystore = await this.session.datadir.listKeyfiles();

		let accounts: any = Object.keys(keystore).map(moniker => ({
			moniker,
			address: keystore[moniker].address,
			balance: 0,
			nonce: 0,
			bytecode: ''
		}));

		if (!accounts.length) {
			color.green('[]');
		}

		const node: Node<undefined> = new Node(
			this.args.options.host!,
			this.args.options.port
		);

		// check connection is valid
		let status: boolean = false;
		try {
			await node.getInfo();
			status = true;
		} catch (e) {
			status = false;
		}

		if (status) {
			const promises = accounts.map(async (acc: any) => {
				const base = await node.getAccount(acc.address);

				return {
					...base,
					balance: base.balance.format('T'),
					moniker: acc.moniker
				};
			});

			accounts = await Promise.all(promises);
		}

		if (!this.args.options.formatted) {
			return color.green(JSON.stringify(accounts));
		}

		const table = new Table({
			head: ['Moniker', 'Address', 'Balance', 'Bytecode']
		});

		for (const a of accounts) {
			table.push([a.moniker, a.address, a.balance, a.bytecode]);
		}

		return color.yellow(table.toString());
	}
}
