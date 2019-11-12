import * as fs from 'fs';

import { Account } from 'evm-lite-core';
import Keystore from 'evm-lite-keystore';

import utils from 'evm-lite-utils';
import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	pwd?: string;
	moniker: string;
};

type Args = Arguments<Opts> & {
	options: Opts;
	privKey: string;
};

type Answers = {
	privKey: string;
	moniker: string;
	outpath: string;
	passphrase: string;
	verifyPassphrase: string;
};

const command = (evmlc: Vorpal, session: Session) => {
	const description = 'Generate a keyfile from private key';

	return evmlc
		.command('accounts generate [privkey]')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('--pwd <file_path>', 'passphrase file path')
		.option('--moniker <name>', 'moniker for generated keyfile')
		.types({
			string: ['_', 'pwd', 'out', 'moniker']
		})
		.action((args: Args) =>
			new AccountGenerateCommand(session, args).run()
		);
};

class AccountGenerateCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		let questions = [
			{
				message: 'Moniker: ',
				name: 'moniker',
				type: 'input'
			},
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			},
			{
				message: 'Re-enter passphrase: ',
				name: 'verifyPassphrase',
				type: 'password'
			}
		];

		if (!this.args.privKey) {
			questions = [
				{
					message: 'Private Key: ',
					name: 'privKey',
					type: 'input'
				},
				...questions
			];
		}

		const answers = await Inquirer.prompt<Answers>(questions);

		if (!(answers.passphrase && answers.verifyPassphrase)) {
			throw Error('Fields cannot be blank');
		}

		if (answers.passphrase !== answers.verifyPassphrase) {
			throw Error('Passphrases do not match');
		}

		this.args.privKey = answers.privKey;

		this.args.options.moniker = answers.moniker;

		this.passphrase = answers.passphrase.trim();
	}

	protected async check(): Promise<void> {
		if (!this.args.privKey) {
			throw Error('Private key cannot be empty');
		}

		if (!this.args.options.moniker) {
			throw Error('Moniker cannot be empty');
		}

		if (!utils.validMoniker(this.args.options.moniker)) {
			throw Error(
				`Invalid characters in moniker: ${this.args.options.moniker}`
			);
		}

		const keystore = await this.datadir.listKeyfiles();
		if (Object.keys(keystore).includes(this.args.options.moniker)) {
			throw Error('Moniker already exists');
		}

		if (!this.passphrase) {
			if (!this.args.options.pwd) {
				throw Error('No passphrase file path provided');
			}

			if (!utils.exists(this.args.options.pwd)) {
				throw Error('Passphrase file path provided does not exist');
			}

			if (utils.isDirectory(this.args.options.pwd)) {
				throw Error('Passphrase file path provided is a directory');
			}

			this.passphrase = fs
				.readFileSync(this.args.options.pwd, 'utf8')
				.trim();
		}
	}

	protected async exec(): Promise<string> {
		this.log.info('keystore', this.datadir.keystorePath);

		this.debug('Attemping to create keyfile with: ');
		this.debug(`Private Key -> ${this.args.privKey}`);
		this.debug(`Moniker -> ${this.args.options.moniker}`);
		this.debug(`Passphrase -> ${this.passphrase}`);

		const account = Account.fromPrivateKey(this.args.privKey);
		const keyfile = Keystore.encrypt(account, this.passphrase!);

		await this.datadir.importKeyfile(this.args.options.moniker, keyfile);

		if (this.args.options.json) {
			return JSON.stringify(account);
		} else {
			return `Address: ${utils.cleanAddress(account.address)}`;
		}
	}
}

export const AccountGenerate = AccountGenerateCommand;

export default command;
