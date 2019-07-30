import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Frames, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../frames';

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

export default function command(evmlc: Vorpal, session: Session): Command {
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

export type Output = IStagedOutput<Arguments, V3JSONKeyStore, V3JSONKeyStore>;

export const stage: IStagingFunction<
	Arguments,
	V3JSONKeyStore,
	V3JSONKeyStore
> = async (args: Arguments, session: Session) => {
	const frames = new Frames<Arguments, V3JSONKeyStore, V3JSONKeyStore>(
		session,
		args
	);

	// prepare
	const { options } = args;

	const { success, debug, error } = frames.staging();
	const { list, decrypt, get } = frames.keystore();

	/** Command Execution */
	const interactive = options.interactive || session.interactive;

	let keystore = await list();

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

	debug(`Moniker validated: ${args.moniker}`);

	let keyfile = await get(args.moniker);

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

		if (!Utils.exists(options.old)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.OLD_PWD_NOT_FOUND,
					'Old passphrase file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(options.old)) {
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

		if (!Utils.exists(options.new)) {
			return Promise.reject(
				error(
					ACCOUNTS_UPDATE.NEW_PWD_NOT_FOUND,
					'New passphrase file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(options.new)) {
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

	const newKeystore = await session.keystore.update(
		args.moniker,
		oldPassphrase,
		newPassphrase
	);

	return Promise.resolve(success(newKeystore));
};
