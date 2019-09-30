import logger, { Logger } from 'npmlog';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Args } from 'vorpal';

import Node, { Account } from 'evm-lite-core';
import ora from 'ora';

import color from './color';
import Session from './Session';

// default options for all commands
export type Options = {
	interactive?: boolean;

	// logging optiosn
	silent?: boolean;
	error?: boolean;
	debug?: boolean;
};

export type Arguments<T> = Args<T>;

// global logger styles
logger.headingStyle = { fg: 'white', bg: 'black' };
logger.addLevel(
	'debug',
	1001,
	{
		fg: 'yellow',
		bg: 'black'
	},
	'debug'
);

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
	protected defaultLogLevel: 'info' | 'debug' = 'info';

	// command level
	private spinner = ora('');

	constructor(public readonly session: Session, public readonly args: T) {
		this.log = logger;
		this.log.level = this.defaultLogLevel;

		this.log.heading = session.name;

		if (this.args.options.debug) {
			this.log.level = 'debug';
		}

		if (this.args.options.error) {
			this.log.level = 'error';
		}

		if (this.args.options.silent) {
			this.log.level = 'silent';
		}
	}

	// runs the command
	public async run(): Promise<void> {
		this.log.debug('init', 'Initializing command');
		const interactive = await this.init();

		try {
			if (this.session.interactive || interactive) {
				this.log.debug('prompt', 'Showing interactive prompts');
				await this.promptQueue();
			}

			this.log.debug('check', 'Parsing arguments');
			await this.check();

			// get out from command
			const o = await this.exec();
			color.green(o);
		} catch (e) {
			let err: Error = e;

			if (typeof e !== 'object') {
				err = new Error(e);
			}

			this.log.error('', err.message.replace(/(\r\n|\n|\r)/gm, ''));
		}

		// reset log level
		this.log.level = this.defaultLogLevel;
		this.stopSpinner();

		return;
	}

	// for testing
	public async execute(): Promise<string> {
		// set log level to show only errors
		this.log.level = 'error';

		await this.init();
		await this.check();

		return await this.exec();
	}

	protected async promptQueue(): Promise<void> {
		await this.prompt();
	}

	protected debug(message: string, title: string = 'exec') {
		this.log.debug(title, message);
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
