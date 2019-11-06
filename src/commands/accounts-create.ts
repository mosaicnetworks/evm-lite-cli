import * as fs from 'fs';

import utils from 'evm-lite-utils';
import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	pwd?: string;
	out: string;
};

type Args = Arguments<Opts> & {
	options: Opts;
	moniker: string;
};

type Answers = {
	moniker: string;
	outpath: string;
	passphrase: string;
	verifyPassphrase: string;
};

const command = (evmlc: Vorpal, session: Session) => {
	const description = 'Creates an encrypted keypair locally';

	return evmlc
		.command('accounts create [moniker]')
		.alias('a c')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('--pwd <file_path>', 'passphrase file path')
		.option('--out <output_path>', 'write keystore to output path')
		.types({
			string: ['_', 'pwd', 'out']
		})
		.action((args: Args) => new AccountCreateCommand(session, args).run());
};

class AccountCreateCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.moniker = this.args.moniker || this.config.defaults.from;
		this.args.options.out =
			this.args.options.out || this.datadir.keystorePath;

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Moniker: ',
				name: 'moniker',
				type: 'input'
			},
			{
				message: 'Output Path: ',
				name: 'outpath',
				type: 'input',
				default: this.args.options.out
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

		const answers = await Inquirer.prompt<Answers>(questions);

		if (!(answers.passphrase && answers.verifyPassphrase)) {
			throw Error('Fields cannot be blank');
		}

		if (answers.passphrase !== answers.verifyPassphrase) {
			throw Error('Passphrases do not match');
		}

		this.args.moniker = answers.moniker;
		this.args.options.out = answers.outpath;

		this.passphrase = answers.passphrase.trim();
	}

	protected async check(): Promise<void> {
		if (!this.args.moniker) {
			throw Error('Moniker cannot be empty');
		}

		if (!utils.validMoniker(this.args.moniker)) {
			throw Error('Moniker contains illegal characters');
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

		if (this.args.options.out) {
			if (!utils.exists(this.args.options.out)) {
				throw Error('Output path provided does not exist');
			}

			if (!utils.isDirectory(this.args.options.out)) {
				throw Error('Output path provided is a not a directory');
			}
		}
	}

	protected async exec(): Promise<string> {
		this.log.info('keystore', this.datadir.keystorePath);

		this.debug('Attemping to create keyfile with: ');
		this.debug(`Moniker -> ${this.args.moniker}`);
		this.debug(`Passphrase -> ${this.passphrase}`);
		this.debug(`Outpath -> ${this.args.options.out}`);

		const account = await this.datadir.newKeyfile(
			this.args.moniker,
			this.passphrase!,
			this.args.options.out
		);

		if (this.args.options.json) {
			return JSON.stringify(account);
		} else {
			return `Address: ${utils.cleanAddress(account.address)}`;
		}
	}
}

export const AccountCreate = AccountCreateCommand;

export default command;
