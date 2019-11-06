import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import utils from 'evm-lite-utils';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	old: string;
	new: string;
};

type Args = Arguments<Opts> & {
	moniker: string;
};

type Answers = {
	moniker: string;
	oldPass: string;
	newPass: string;
	verifyNewPass: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Update passphrase for a local account';

	return evmlc
		.command('accounts update [moniker]')
		.alias('a u')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('-o, --old <path>', 'old passphrase file path')
		.option('-n, --new <path>', 'new passphrase file path')
		.types({
			string: ['_', 'old', 'o', 'n', 'new']
		})
		.action((args: Args) => new AccountUpdateCommand(session, args).run());
};

class AccountUpdateCommand extends Command<Args> {
	protected oldPassphrase: string = '';
	protected newPassphrase: string = '';

	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const keystore = await this.datadir.listKeyfiles();

		const first: Inquirer.QuestionCollection<Answers> = [
			{
				choices: Object.keys(keystore).map(moniker => moniker),
				message: 'Moniker: ',
				name: 'moniker',
				type: 'list'
			},
			{
				message: 'Enter current passphrase: ',
				name: 'oldPass',
				type: 'password'
			},
			{
				message: 'New passphrase : ',
				name: 'newPass',
				type: 'password'
			},
			{
				message: 'Re-enter new passphrase: ',
				name: 'verifyNewPass',
				type: 'password'
			}
		];

		const answers = await Inquirer.prompt<Answers>(first);

		if (!(answers.newPass && answers.verifyNewPass)) {
			throw Error('Fields cannot be blank.');
		}

		if (answers.newPass !== answers.verifyNewPass) {
			throw Error('Passphrases do not match.');
		}

		this.args.moniker = answers.moniker;

		this.oldPassphrase = answers.oldPass.trim();
		this.newPassphrase = answers.newPass.trim();
	}

	protected async check(): Promise<void> {
		if (!this.args.moniker) {
			throw Error('No moniker provided.');
		}

		if (!utils.validMoniker(this.args.moniker)) {
			throw Error('Invalid characters in moniker.');
		}

		if (!this.oldPassphrase) {
			if (!this.args.options.old) {
				throw Error('Old passphrase file path not provided.');
			}

			if (!utils.exists(this.args.options.old)) {
				throw Error(
					'Old passphrase file path provided does not exist.'
				);
			}

			if (utils.isDirectory(this.args.options.old)) {
				throw Error(
					'Old passphrase file path provided is a directory.'
				);
			}

			this.oldPassphrase = fs
				.readFileSync(this.args.options.old, 'utf8')
				.trim();
		}

		if (!this.newPassphrase) {
			if (!this.args.options.new) {
				throw Error('New passphrase file path not provided.');
			}

			if (!utils.exists(this.args.options.new)) {
				throw Error(
					'New passphrase file path provided does not exist.'
				);
			}

			if (utils.isDirectory(this.args.options.new)) {
				throw Error(
					'Old passphrase file path provided is a directory.'
				);
			}

			this.newPassphrase = fs
				.readFileSync(this.args.options.new, 'utf8')
				.trim();
		}

		if (this.oldPassphrase === this.newPassphrase) {
			throw Error('New passphrase cannot be the same as old.');
		}
	}

	protected async exec(): Promise<string> {
		this.log.info('keystore', this.datadir.keystorePath);

		this.debug('Attemping to update keyfile with: ');
		this.debug(`Moniker -> ${this.args.moniker}`);
		this.debug(`New Passphrase -> ${this.newPassphrase}`);

		const keyfile = await this.datadir.updateKeyfile(
			this.args.moniker,
			this.oldPassphrase,
			this.newPassphrase
		);

		if (this.args.options.json) {
			return JSON.stringify(keyfile);
		} else {
			return `Passphrase updated: ${keyfile.address}`;
		}
	}
}
