import log from 'npmlog';

import { IConfiguration } from 'evm-lite-datadir';
import { Args } from 'vorpal';

import Session from './Session';

// default options for all commands
export type TOptions = {
	debug?: boolean;
};

export type TArgs<T> = Args<T>;

abstract class Command<T = TArgs<TOptions>> {
	protected readonly config: IConfiguration;

	constructor(protected readonly session: Session, public readonly args: T) {
		this.config = this.session.datadir.config;
	}

	// runs the command
	public async run(): Promise<void> {
		const proceed = await this.init();

		if (proceed) {
			try {
				if (this.session.interactive) {
					await this.interactive();
				}

				await this.check();

				return await this.exec();
			} catch (e) {
				let err: Error = e;

				if (typeof e !== 'object') {
					err = new Error(e);
				}

				log.error('evmlc', err.message);
			}
		}
	}

	// prepare command execution
	protected abstract async init(): Promise<boolean>;

	// do interactive command execution
	protected abstract async interactive(): Promise<void>;

	// execute command
	protected abstract async exec(): Promise<void>;

	// parse arguments of command here
	protected abstract async check(): Promise<void>;
}

export default Command;
