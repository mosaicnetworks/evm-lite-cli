import Inquirer from 'inquirer';

import logger, { Logger } from 'npmlog';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Args } from 'vorpal';

import Node, { Account } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';

import color from './color';
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
	protected node?: Node<TConsensus>;

	// command that requires an account to sign transaction
	protected account?: Account;

	// the passphrase used to decrypt the account
	protected passphrase?: string;

	// command level logger
	protected log: Logger;

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
				await this.prompt();
			}

			// check if arguments are valid
			await this.check();

			// get out from command
			const o = await this.exec();
			color.green(o);

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

	// for testing
	public async test(): Promise<string> {
		await this.init();
		await this.check();

		return await this.exec();
	}

	protected get config() {
		return this.session.datadir.config;
	}

	protected get datadir() {
		return this.session.datadir;
	}

	// prepare command execution
	protected abstract async init(): Promise<boolean>;

	// do interactive command execution
	protected abstract async prompt(): Promise<void>;

	// parse arguments of command here
	protected abstract async check(): Promise<void>;

	// execute command
	protected abstract async exec(): Promise<string>;

	protected async decryptPrompt() {
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
			const fromQ: any = questions[0];

			fromQ.default = `${
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
