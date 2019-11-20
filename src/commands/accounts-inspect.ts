import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import DataDirectory from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	pwd: string;
	private: boolean;
};

type Args = Arguments<Opts> & {
	moniker: string;
};

type Answers = {
	passphrase: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Inspect a keyfile';

	return evmlc
		.command('accounts inspect [moniker]')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--private', 'show private key')
		.option('-p, --pwd <path>', 'passphrase file path')
		.types({
			string: ['_', 'p', 'pwd']
		})
		.action((args: Args) => new AccountInspectCommand(session, args).run());
};

class AccountInspectCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.moniker = this.args.moniker || this.config.defaults.from;

		if (!this.args.moniker) {
			throw Error('No moniker specified');
		}

		this.log.info('moniker', this.args.moniker);

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		if (!answers.passphrase) {
			throw Error('Passphrase cannot be blank.');
		}

		this.passphrase = answers.passphrase.trim();
	}

	protected async check(): Promise<void> {
		if (!this.args.moniker) {
			throw Error('No moniker provided.');
		}

		if (!utils.validMoniker(this.args.moniker)) {
			throw Error('Invalid characters in moniker.');
		}

		if (!this.passphrase) {
			if (!this.args.options.pwd) {
				throw Error('Old passphrase file path not provided.');
			}

			if (!utils.exists(this.args.options.pwd)) {
				throw Error(
					'Old passphrase file path provided does not exist.'
				);
			}

			if (utils.isDirectory(this.args.options.pwd)) {
				throw Error(
					'Old passphrase file path provided is a directory.'
				);
			}

			this.passphrase = fs
				.readFileSync(this.args.options.pwd, 'utf8')
				.trim();
		}
	}

	protected async exec(): Promise<string> {
		this.debug('Attemping to show private key for: ');
		this.debug(`Moniker -> ${this.args.moniker}`);
		this.debug(`Passphrase -> ${this.passphrase}`);

		const keyfile = await this.datadir.getKeyfile(this.args.moniker);
		const account = await DataDirectory.decrypt(keyfile, this.passphrase!);

		if (this.args.options.json) {
			const json: any = { address: account.address, publicKey: '' };

			if (this.args.options.private) {
				json.privateKey = account.privateKey;
			}

			return JSON.stringify(json);
		} else {
			let res = `Address: ${account.address} \n`;

			if (this.args.options.private) {
				res += `Private Key: ${account.privateKey}`;
			}

			// add public key

			return res;
		}
	}
}
