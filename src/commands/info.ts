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

export default (evmlc: Vorpal, session: Session): Command => {
	return evmlc
		.command('info')
		.description('Display information about node')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action((args: Args) => new InfoCommand(session, args).run());
};

class InfoCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		return false;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		const node = new Node(this.args.options.host, this.args.options.port);

		const info = await node.getInfo();
		const table = new Table({
			head: ['Key', 'Value']
		});

		for (const key of Object.keys(info)) {
			table.push({
				// @ts-ignore
				[key]: info[key]
			});
		}

		if (!this.args.options.formatted && !this.session.interactive) {
			return color.green(JSON.stringify(info));
		}

		return color.green(table.toString());
	}
}

export const Info = InfoCommand;
