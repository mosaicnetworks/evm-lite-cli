import Table from 'cli-table';
import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node from 'evm-lite-core';
import utils from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	formatted?: boolean;
	interactive?: boolean;
	host?: string;
	port?: number;
}

interface Args extends IArgs<Opts> {
	address: string;
}

interface Answers {
	address: string;
}

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Fetches account details from a connected node';

	return evmlc
		.command('accounts get [address]')
		.alias('a g')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-i, --interactive', 'enter interactive mode')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'h', 'host']
		})
		.action((args: Args) => new AccountGetCommand(session, args).run());
};

class AccountGetCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.args.options.formatted = this.args.options.formatted || false;

		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.node = new Node(this.args.options.host!, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Address: ',
				name: 'address',
				type: 'input'
			}
		];

		const { address } = await Inquirer.prompt<Answers>(questions);

		this.args.address = address;
	}

	protected async check(): Promise<void> {
		if (!this.args.address) {
			throw Error('No address provided');
		}

		this.args.address = utils.trimHex(this.args.address);

		if (this.args.address.length !== 40) {
			throw Error('Address has an invalid length.');
		}
	}

	protected async exec(): Promise<void> {
		const a = await this.node!.getAccount(this.args.address);

		if (!this.args.options.formatted && !this.args.options.interactive) {
			return color.green(
				JSON.stringify({
					...a,
					balance: a.balance.format('T')
				})
			);
		}

		const table = new Table({
			head: ['Address', 'Balance', 'Nonce', 'Bytecode']
		});

		table.push([a.address, a.balance.format('T'), a.nonce, a.bytecode]);

		return color.green(table.toString());
	}
}

export const AccountGet = AccountGetCommand;
