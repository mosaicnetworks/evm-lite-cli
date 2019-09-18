import Table from 'cli-table';
import Vorpal from 'vorpal';

import Node from 'evm-lite-core';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	formatted?: boolean;
	host: string;
	port: number;
}

export interface Args extends IArgs<Opts> {}

export default (evmlc: Vorpal, session: Session) => {
	return evmlc
		.command('test')
		.hidden()
		.description('Display information about node')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action((args: Args) => new TestCommand(session, args).run());
};

class TestCommand extends Command<Args> {
	public async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return false;
	}

	public async prompt(): Promise<void> {
		await this.decryptPrompt();

		return;
	}

	public async check(): Promise<void> {
		return;
	}

	public async exec(): Promise<void> {
		console.log(this.account);
	}
}

export const Test = TestCommand;
