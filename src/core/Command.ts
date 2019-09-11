import log from 'npmlog';

import { Args } from 'vorpal';

import Session from './Session';

// default options for all commands
export type TOptions = {
	debug?: boolean;
};

export type TArgs<T> = Args<T>;

const app = 'evmlite';

abstract class Command<T = TArgs<TOptions>> {
	constructor(protected readonly session: Session, public readonly args: T) {}

	// prepare command execution
	public abstract async init(): Promise<boolean>;

	// execute command
	public abstract async exec(): Promise<void>;

	// runs the command
	public async run(): Promise<void> {
		const proceed = await this.init();

		if (proceed) {
			try {
				const e = await this.exec();

				return e;
			} catch (e) {
				let err: Error = e;

				if (typeof e !== 'object') {
					err = new Error(e);
				}

				log.error('evmlc', err.message);
			}
		}
	}
}

export default Command;
