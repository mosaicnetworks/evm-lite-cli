import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';
import utils from 'evm-lite-utils';

import { IV3Keyfile } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

import { ACCOUNTS_UPDATE } from '../errors/accounts';

interface Options extends IOptions {
	interactive?: boolean;
	old?: string;
	new?: string;
}

export interface Arguments extends Args<Options> {
	options: Options;
	moniker?: string;
}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
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
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface FirstAnswers {
	moniker: string;
}

interface SecondAnswers {
	passphrase: string;
}

interface ThirdAnswers {
	passphrase: string;
	verifyPassphrase: string;
}

export type Output = IStagedOutput<Arguments, IV3Keyfile, IV3Keyfile>;

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, IV3Keyfile>(args);

	// prepare
	const { options } = args;

	// handlers
	const { success, debug, error } = staging.handlers(session.debug);

	// hooks
	const { list, decrypt, get } = staging.keystoreHooks(session);

	// command exectuion
	const interactive = options.interactive || session.interactive;

	const keystore = await list();

	const first: inquirer.Questions<FirstAnswers> = [
		{
			choices: Object.keys(keystore).map(moniker => moniker),
			message: 'Moniker: ',
			name: 'moniker',
			type: 'list'
		}
	];

	const second: inquirer.Questions<SecondAnswers> = [
		{
			message: 'Enter current passphrase: ',
			name: 'passphrase',
			type: 'password'
		}
	];

	const third: inquirer.Questions<SecondAnswers> = [
		{
			message: 'New passphrase : ',
			name: 'passphrase',
			type: 'password'
		},
		{
			message: 'Re-enter new passphrase: ',
			name: 'verifyPassphrase',
			type: 'password'
		}
	];

	if (interactive && !args.moniker) {
		const { moniker } = await inquirer.prompt<FirstAnswers>(first);

		args.moniker = moniker;

		debug(`Moniker received: ${moniker}`);
	}

	if (!args.moniker) {
		return Promise.reject(
			error(ACCOUNTS_UPDATE.MONIKER_EMPTY, 'No moniker provided.')
		);
	}

	if (!utils.validMoniker(args.moniker)) {
		return Promise.reject(
			error(
				ACCOUNTS_UPDATE.INVALID_MONIKER,
				'Invalid characters in moniker.'
			)
		);
	}

	debug(`Moniker validated: ${args.moniker}`);

	const keyfile = await get(args.moniker);

	let oldPassphrase: string = '';
	let newPassphrase: string = '';

	if (!options.old && interactive) {
		const { passphrase } = await inquirer.prompt<SecondAnswers>(second);

		oldPassphrase = passphrase.trim();

		debug(`Old passphrase received: ${oldPassphrase}`);
	}

	if (!oldPassphrase) {
		debug(`Old passphrase path: ${options.old || 'null'}`);

		if (!options.old) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.OLD_PWD_EMPTY,
					'Old passphrase file path not provided.'
				)
			);
		}

		if (!utils.exists(options.old)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.OLD_PWD_NOT_FOUND,
					'Old passphrase file path provided does not exist.'
				)
			);
		}

		if (utils.isDirectory(options.old)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.OLD_PWD_IS_DIR,
					'Old passphrase file path provided is a directory.'
				)
			);
		}

		oldPassphrase = fs.readFileSync(options.old, 'utf8').trim();

		debug(`Old passphrase read successfully: ${oldPassphrase}`);
	}

	await decrypt(keyfile, oldPassphrase);

	if (!options.new && interactive) {
		const { passphrase, verifyPassphrase } = await inquirer.prompt<
			ThirdAnswers
		>(third);

		debug(`Passphrase received: ${passphrase || 'null'}`);
		debug(`Verify passphrase received: ${verifyPassphrase || 'null'}`);

		if (!(passphrase && verifyPassphrase)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.PASS_FIELDS_BLANK,
					'Fields cannot be blank.'
				)
			);
		}

		if (passphrase !== verifyPassphrase) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.PASS_FIELDS_BLANK,
					'Passphrases do not match.'
				)
			);
		}

		newPassphrase = passphrase.trim();

		debug(`New passphrase set: ${newPassphrase}`);
	}

	if (!newPassphrase) {
		debug(`New passphrase file path: ${options.new || 'null'}`);

		if (!options.new) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.NEW_PWD_EMPTY,
					'New passphrase file path not provided.'
				)
			);
		}

		if (!utils.exists(options.new)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.NEW_PWD_NOT_FOUND,
					'New passphrase file path provided does not exist.'
				)
			);
		}

		if (utils.isDirectory(options.new)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.NEW_PWD_IS_DIR,
					'Old passphrase file path provided is a directory.'
				)
			);
		}

		newPassphrase = fs.readFileSync(options.new, 'utf8').trim();

		debug(`New passphrase read successfully: ${newPassphrase}`);
	}

	if (oldPassphrase === newPassphrase) {
		return Promise.reject(
			error(
				ACCOUNTS_UPDATE.SAME_OLD_NEW_PWD,
				'New passphrase cannot be the same as old.'
			)
		);
	}

	debug(`Attempting to update passphrase for address...`);

	const newKeystore = await session.datadir.updateKeyfile(
		args.moniker,
		oldPassphrase,
		newPassphrase
	);

	return Promise.resolve(success(newKeystore));
};
