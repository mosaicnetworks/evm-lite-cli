import logger, { Logger } from 'npmlog';

import { Args } from 'vorpal';

import Node from 'evm-lite-core';

import Session from './Session';

// default options for all commands
export interface IOptions {
	silent: boolean;
}

export type IArgs<T> = Args<T>;

abstract class Command<T extends IArgs<IOptions> = IArgs<IOptions>> {
	protected node?: Node<any>;
	protected log: Logger;

	constructor(protected readonly session: Session, public readonly args: T) {
		this.log = logger;

		if (this.args.options.silent) {
			this.log.level = 'error';
		}
	}

	public get config() {
		return this.session.datadir.config;
	}

	public get datadir() {
		return this.session.datadir;
	}

	// runs the command
	public async run(): Promise<void> {
		const interactive = await this.init();

		try {
			if (this.session.interactive || interactive) {
				await this.interactive();
			}

			await this.check();

			return await this.exec();
		} catch (e) {
			let err: Error = e;

			if (typeof e !== 'object') {
				err = new Error(e);
			}

			this.log.error('evmlc', err.message.replace(/(\r\n|\n|\r)/gm, ''));
		}
	}

	// prepare command execution
	protected abstract async init(): Promise<boolean>;

	// do interactive command execution
	protected abstract async interactive(): Promise<void>;

	// parse arguments of command here
	protected abstract async check(): Promise<void>;

	// execute command
	protected abstract async exec(): Promise<void>;
}

export default Command;
