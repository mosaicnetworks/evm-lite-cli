import logger, { Logger } from 'npmlog';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Args } from 'vorpal';

import Node, { Account } from 'evm-lite-core';
import ora from 'ora';

import color from './color';
import Session from './Session';

// default options for all commands
export type Options = {
	silent?: boolean;
	interactive?: boolean;
};

export type Arguments<T> = Args<T>;

abstract class Command<
	T extends Arguments<Options> = Arguments<Options>,
	TConsensus extends IAbstractConsensus = Solo
> {
	protected get config() {
		return this.session.datadir.config;
	}

	protected get datadir() {
		return this.session.datadir;
	}

	// node will be set here if the command requires it
	protected node?: Node<TConsensus>;

	// command that requires an account to sign transaction
	protected account?: Account;

	// the passphrase used to decrypt the account
	protected passphrase?: string;

	// command level logger
	protected log: Logger;

	// command level
	private spinner = ora('');

	constructor(public readonly session: Session, public readonly args: T) {
		this.log = logger;

		if (this.args.options.silent) {
			this.log.level = 'error';
		}
	}

	// runs the command
	public async run(): Promise<void> {
		const interactive = await this.init();

		try {
			if (this.session.interactive || interactive) {
				await this.promptQueue();
			}

			// check if arguments are valid
			await this.check();

			// get out from command
			const o = await this.exec();
			color.green(o);

			// reset log level
			this.log.level = 'silly';
			this.stopSpinner();

			return;
		} catch (e) {
			// stop spinner
			this.stopSpinner();

			let err: Error = e;

			if (typeof e !== 'object') {
				err = new Error(e);
			}

			this.log.error('evmlc', err.message.replace(/(\r\n|\n|\r)/gm, ''));
		}
	}

	// for testing
	public async execute(): Promise<string> {
		// set log level to show only errors
		this.log.level = 'silent';

		await this.init();
		await this.check();

		return await this.exec();
	}

	protected async promptQueue(): Promise<void> {
		await this.prompt();
	}

	// prepare command execution
	protected abstract async init(): Promise<boolean>;

	// do interactive command execution
	protected abstract async prompt(): Promise<void>;

	// parse arguments of command here
	protected abstract async check(): Promise<void>;

	// execute command
	protected abstract async exec(): Promise<string>;

	protected startSpinner(text: string) {
		if (this.args.options.interactive) {
			this.spinner.text = text;
			this.spinner.start();
		}
	}

	protected stopSpinner() {
		this.spinner.stop();
	}
}

export default Command;
