import log from 'npmlog';
import Vorpal from 'vorpal';

import { Args } from 'vorpal';

import Node from 'evm-lite-core';

import Session from './Session';

// default options for all commands
export interface IOptions {}

export type IArgs<T> = Args<T>;

abstract class Command<T = IArgs<IOptions>> {
	protected node?: Node<any>;

	constructor(protected readonly session: Session, public readonly args: T) {
		const style = {
			bg: '',
			bold: true
		};

		log.addLevel('debug', 5, style);
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

			log.error('evmlc', err.message.replace(/(\r\n|\n|\r)/gm, ''));
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

	protected debug(s: string) {
		log.debug('debug', s);
	}
}

export default Command;
