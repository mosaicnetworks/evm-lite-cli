import Vorpal from 'vorpal';

import Node from 'evm-lite-core';

import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;
	host: string;
	port: number;
}

interface Args extends IArgs<Opts> {
	address: string;
}

interface Answers {
	address: string;
}

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Check whether an address is on the whitelist';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'enter interactive')
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'from', 'h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new POACheckCommand(session, args).run()
		);
};

class POACheckCommand extends Command {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		return;
	}
}

export const POACheck = POACheckCommand;
