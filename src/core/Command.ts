import Inquirer from 'inquirer';

import logger, { Logger } from 'npmlog';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Args } from 'vorpal';

import Node, { Account } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';

import Session from './Session';

// default options for all commands
export interface IOptions {
	silent: boolean;
}

export type IArgs<T> = Args<T>;

interface IDecryptPrompt {
	from: string;
	passphrase: string;
}

abstract class Command<
	T extends IArgs<IOptions> = IArgs<IOptions>,
	TConsensus extends IAbstractConsensus = Solo
> {
	// node will be set here if the command requires it
	public node?: Node<TConsensus>;

	// command that requires an account to sign transaction
	public account?: Account;

	// the passphrase used as an of the account
	public passphrase?: string;

	// logger
	public log: Logger;

	constructor(public readonly session: Session, public readonly args: T) {
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
				await this.prompt();
			}

			await this.check();

			// should this fn return a string and then be formatted in the function
			// rather than logging in the function this allows for better testing
			// as we can actually read the return of the function rather than reading
			// frmo stdio
			await this.exec();

			// reset log level
			this.log.level = 'silly';

			return;
		} catch (e) {
			let err: Error = e;

			if (typeof e !== 'object') {
				err = new Error(e);
			}

			this.log.error('evmlc', err.message.replace(/(\r\n|\n|\r)/gm, ''));
		}
	}

	// prepare command execution
	public abstract async init(): Promise<boolean>;

	// do interactive command execution
	public abstract async prompt(): Promise<void>;

	// parse arguments of command here
	public abstract async check(): Promise<void>;

	// execute command
	public abstract async exec(): Promise<void>;

	public async decryptPrompt() {
		const keystore = await this.datadir.listKeyfiles();

		if (!this.node) {
			throw Error('No node assigned to command');
		}

		// check connection
		await this.node.getInfo();

		// fetch account balances
		const accounts: any = await Promise.all(
			Object.keys(keystore).map(async moniker => {
				const base = await this.node!.getAccount(
					keystore[moniker].address
				);

				return {
					...base,
					moniker
				};
			})
		);

		const defaultAccount =
			accounts.filter(
				(a: any) =>
					a.moniker.toLowerCase() ===
					this.config.defaults.from.toLowerCase()
			)[0] || undefined;

		const questions: Inquirer.QuestionCollection<IDecryptPrompt> = [
			{
				choices: accounts.map(
					(acc: any) => `${acc.moniker} (${acc.balance.format('T')})`
				),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			}
		];

		if (defaultAccount) {
			// @ts-ignore
			questions[0].default = `${
				defaultAccount.moniker
			} (${defaultAccount.balance.format('T')})`;
		}

		const answers = await Inquirer.prompt<IDecryptPrompt>(questions);

		const from = answers.from.split(' ')[0];
		if (!from) {
			throw Error('`from` moniker not provided.');
		}

		if (!answers.passphrase) {
			throw Error('Passphrase not provided.');
		}

		const keyfile = await this.datadir.getKeyfile(from);
		this.account = Datadir.decrypt(keyfile, answers.passphrase.trim());
	}
}

export default Command;
