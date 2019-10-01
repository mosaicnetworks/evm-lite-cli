import * as fs from 'fs';
import * as path from 'path';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import utils from 'evm-lite-utils';

import { IConfiguration } from 'evm-lite-datadir';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	default?: boolean;
	file: string;
};

type Args = Arguments<Opts> & {
	moniker: string;
};

type Answers = {
	moniker: string;
	file: string;
	makeDefault: boolean;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Import an encrypted keyfile to the keystore';

	return evmlc
		.command('accounts import [moniker]')
		.alias('a i')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('--default', 'set imported account as default from address')
		.option('-f ,--file <keyfile_path>', 'keyfile file path')
		.option('-d, --debug', 'show debug output')
		.types({
			string: ['_', 'pwd']
		})
		.action((args: Args) => new AccountImportCommand(session, args).run());
};

class AccountImportCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

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
				message: 'Keyfile Path: ',
				name: 'file',
				type: 'input'
			},
			{
				message: 'Make default: ',
				name: 'makeDefault',
				type: 'confirm'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.moniker = answers.moniker;
		this.args.options.file = answers.file;
		this.args.options.default = answers.makeDefault || false;
	}

	protected async check(): Promise<void> {
		if (!this.args.moniker) {
			throw Error('Moniker cannot be empty');
		}

		if (!utils.validMoniker(this.args.moniker)) {
			throw Error('Moniker contains illegal characters');
		}

		if (!this.args.options.file) {
			throw Error('--file path not provided.');
		}

		if (!utils.exists(this.args.options.file)) {
			throw Error('--file path provided does not exist.');
		}

		if (utils.isDirectory(this.args.options.file)) {
			throw Error('--file path provided is a directory.');
		}
	}

	protected async exec(): Promise<string> {
		this.log.info('keystore', this.datadir.keystorePath);

		this.debug(`Attempting to read -> ${this.args.options.file}`);
		const keyfile = JSON.parse(
			fs.readFileSync(path.join(this.args.options.file), 'utf8')
		);

		// import keyfile
		this.debug(`Attempting to import keyfile`);
		await this.datadir.importKeyfile(this.args.moniker, keyfile);

		if (this.args.options.default) {
			this.debug(
				`Setting default 'from' moniker to ${this.args.moniker}`
			);
			const newConfig: IConfiguration = {
				...this.datadir.config,
				defaults: {
					...this.datadir.config.defaults,
					from: this.args.moniker
				}
			};

			await this.datadir.saveConfig(newConfig);
		}

		return JSON.stringify(keyfile);
	}
}

export const AccountImport = AccountImportCommand;
