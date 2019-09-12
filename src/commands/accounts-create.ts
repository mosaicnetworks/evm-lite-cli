import * as fs from 'fs';

import utils from 'evm-lite-utils';
import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import color from '../core/color';
import Session from '../core/Session';

import Command, { TArgs, TOptions } from '../core/Command';

interface Opts extends TOptions {
	interactive?: boolean;
	debug?: boolean;
	pwd?: string;
	out?: string;
}

interface Args extends TArgs<Opts> {
	moniker?: string;
}

interface Answers {
	moniker: string;
	outpath: string;
	passphrase: string;
	verifyPassphrase: string;
}

/**
 * Should construct a Vorpal.Command instance for the command `accounts create`
 *
 * @remarks
 * Allows you to create and encrypt accounts locally. Created accounts will
 * either be placed in the keystore folder provided by default config file
 * (located at `~/datadir/config.toml`) or the config file located in the
 * `--datadir, -d` flag.
 *
 * Usage: `accounts create [moniker] --out ~/datadir/keystore --pwd ~/pwd.txt`
 *
 * Here we have specified to create the account file in `~/datadir/keystore`,
 * encrypt with the `~/pwd.txt` and once that is done, provide string json
 * output of the created account.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 */
const command = (evmlc: Vorpal, session: Session): Command => {
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
	protected passphrase: string = '';

	protected async init(): Promise<boolean> {
		if (this.args.options.interactive) {
			this.session.interactive = true;
		}

		this.args.moniker = this.args.moniker || this.config.defaults.from;
		this.args.options.out =
			this.args.options.out || this.session.datadir.keystorePath;

		return true;
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
				throw Error('Passphrase file path provided does not exist.');
			}

			if (utils.isDirectory(this.args.options.pwd)) {
				throw Error('Passphrase file path provided is a directory.');
			}

			this.passphrase = fs
				.readFileSync(this.args.options.pwd, 'utf8')
				.trim();
		}

		if (this.args.options.out) {
			if (!utils.exists(this.args.options.out)) {
				throw Error('Output path provided does not exist.');
			}

			if (!utils.isDirectory(this.args.options.out)) {
				throw Error('Output path provided is a not a directory.');
			}
		}
	}

	protected async interactive(): Promise<void> {
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				message: 'Moniker: ',
				name: 'moniker',
				type: 'input',
				default: this.session.datadir.config.defaults.from
			},
			{
				message: 'Output Path: ',
				name: 'outpath',
				type: 'input',
				default: this.session.datadir.keystorePath
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

	protected async exec(): Promise<void> {
		const account = await this.session.datadir.newKeyfile(
			this.args.moniker!,
			this.passphrase,
			this.args.options.out
		);

		return color.green(JSON.stringify(account));
	}
}

export const AccountCreate = AccountCreateCommand;

export default command;
