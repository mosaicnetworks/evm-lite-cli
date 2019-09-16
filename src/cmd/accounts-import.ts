import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as path from 'path';

import Vorpal, { Args, Command } from 'vorpal';

import utils from 'evm-lite-utils';

import { Solo } from 'evm-lite-consensus';
import { IConfiguration } from 'evm-lite-datadir';
import { IV3Keyfile } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

import { ACCOUNTS_IMPORT } from '../errors/accounts';

interface Options extends IOptions {
	interactive?: boolean;
	default?: boolean;
	file?: string;
}

export interface Arguments extends Args<Options> {
	options: Options;
	moniker?: string;
}

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
	const description = 'Import an encrypted keyfile to the keystore';

	return evmlc
		.command('accounts import [moniker]')
		.alias('a i')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--default', 'set imported account as default from address')
		.option('-f ,--file <keyfile_path>', 'keyfile file path')
		.option('-d, --debug', 'show debug output')
		.types({
			string: ['_', 'pwd']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
};

interface Answers {
	moniker: string;
	file: string;
	makeDefault: boolean;
}

export type Output = IStagedOutput<Arguments, IV3Keyfile, IV3Keyfile>;

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, IV3Keyfile>(args);

	// prepare
	const { options } = args;

	// handlers
	const { success, error, debug } = staging.handlers(session.debug);

	// command execution
	const interactive = options.interactive || session.interactive;
	const questions: inquirer.QuestionCollection<Answers> = [
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

	if (interactive && !options.file) {
		const { file, makeDefault, moniker } = await inquirer.prompt<Answers>(
			questions
		);

		debug(`Keyfile path: ${file || 'null'}`);

		args.moniker = moniker;
		options.file = file;
		options.default = makeDefault || false;
	}

	// validate moniker
	if (!args.moniker) {
		return Promise.reject(
			error(ACCOUNTS_IMPORT.EMPTY_MONIKER, 'Moniker cannot be empty')
		);
	}

	if (!utils.validMoniker(args.moniker)) {
		return Promise.reject(
			error(
				ACCOUNTS_IMPORT.INVALID_MONIKER,
				'Moniker contains illegal characters'
			)
		);
	}

	if (!options.file) {
		return Promise.reject(
			error(ACCOUNTS_IMPORT.FILE_PATH_EMPTY, '--file path not provided.')
		);
	}

	if (!utils.exists(options.file)) {
		return Promise.reject(
			error(
				ACCOUNTS_IMPORT.FILE_PATH_NOT_FOUND,
				'--file path provided does not exist.'
			)
		);
	}

	if (utils.isDirectory(options.file)) {
		return Promise.reject(
			error(
				ACCOUNTS_IMPORT.FILE_IS_DIR,
				'--file path provided is a directory.'
			)
		);
	}

	debug(`Keyfile path verified: ${options.file}`);

	let keyfile: IV3Keyfile;

	debug(`Keystore directory: ${session.datadir.keystorePath}`);
	debug(`Attempting to import keyfile...`);

	try {
		keyfile = JSON.parse(fs.readFileSync(path.join(options.file), 'utf8'));
	} catch (e) {
		return Promise.reject(e);
	}

	// write file
	try {
		await session.datadir.importKeyfile(args.moniker, keyfile);
	} catch (e) {
		return Promise.reject(e.toString());
	}

	debug(`Setting as default address...`);

	if (options.default) {
		const newConfig: IConfiguration = {
			...session.datadir.config,
			defaults: {
				...session.datadir.config.defaults,
				from: args.moniker
			}
		};

		await session.datadir.saveConfig(newConfig);
	}

	return Promise.resolve(success(keyfile));
};
