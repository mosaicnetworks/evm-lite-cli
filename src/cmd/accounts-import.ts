import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import { Utils } from 'evm-lite-core';
import { Utils as KeystoreUtils, V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { ACCOUNTS_IMPORT } from '../errors/accounts';
import { KEYSTORE } from '../errors/generals';

interface Options extends GenericOptions {
	interactive?: boolean;
	pwd?: string;
}

export interface Arguments extends Args<Options> {
	priv_key?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Fetches account details from a connected node';

	return evmlc
		.command('accounts import [priv_key]')
		.alias('a i')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--pwd <path>', 'passphrase file path')
		.option('-d, --debug', 'show debug output')
		.types({
			string: ['_', 'pwd']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	priv_key: string;
	passphrase: string;
	verifyPassphrase: string;
}

export type Output = StagedOutput<Arguments, V3JSONKeyStore, V3JSONKeyStore>;

export const stage: StagingFunction<
	Arguments,
	V3JSONKeyStore,
	V3JSONKeyStore
> = async (args: Arguments, session: Session) => {
	const staging = new Staging<Arguments, V3JSONKeyStore, V3JSONKeyStore>(
		session.debug,
		args
	);

	let passphrase: string = '';

	const interactive = args.options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
		{
			message: 'Private Key: ',
			name: 'priv_key',
			type: 'input'
		},
		{
			message: 'Passphrase: ',
			name: 'passphrase',
			type: 'password'
		},
		{
			message: 'Re-enter Passphrase: ',
			name: 'verifyPassphrase',
			type: 'password'
		}
	];

	if (interactive) {
		const {
			priv_key,
			passphrase: p,
			verifyPassphrase
		} = await inquirer.prompt<Answers>(questions);

		staging.debug(`Private key received: ${priv_key || 'null'}`);
		staging.debug(`Passphrase received: ${p || 'null'}`);
		staging.debug(
			`Verify passphrase received: ${verifyPassphrase || 'null'}`
		);

		if (!(p && verifyPassphrase)) {
			return Promise.reject(
				staging.error(
					ACCOUNTS_IMPORT.PASS_FIELDS_BLANK,
					'Fields cannot be blank'
				)
			);
		}

		if (p !== verifyPassphrase) {
			return Promise.reject(
				staging.error(
					ACCOUNTS_IMPORT.PASS_DO_NOT_MATCH,
					'Passphrases do not match'
				)
			);
		}

		args.priv_key = priv_key;
		passphrase = p.trim();

		staging.debug(`Passphrase set: ${passphrase}`);
	}

	if (!args.priv_key) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_IMPORT.PRIV_KEY_EMPTY,
				'No private key provided.'
			)
		);
	}

	args.priv_key = Utils.cleanAddress(args.priv_key);

	staging.debug(`Private key validated: ${args.priv_key}`);

	if (!passphrase) {
		staging.debug(`Passphrase file path: ${args.options.pwd || 'null'}`);

		if (!args.options.pwd) {
			return Promise.reject(
				staging.error(
					ACCOUNTS_IMPORT.PWD_PATH_EMPTY,
					'--pwd file path not provided.'
				)
			);
		}

		if (!KeystoreUtils.exists(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					ACCOUNTS_IMPORT.PWD_PATH_NOT_FOUND,
					'--pwd file path provided does not exist.'
				)
			);
		}

		if (KeystoreUtils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					ACCOUNTS_IMPORT.PWD_IS_DIR,
					'--pwd file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Passphrase read successfully: ${passphrase}`);
	}

	let keystore: V3JSONKeyStore;

	staging.debug(`Import directory: ${session.keystore.path}`);
	staging.debug(`Attempting to import private key...`);

	try {
		keystore = await session.keystore.import(args.priv_key, passphrase);
	} catch (e) {
		return Promise.reject(staging.error(KEYSTORE.IMPORT, e.toString()));
	}

	return Promise.resolve(staging.success(keystore));
};
