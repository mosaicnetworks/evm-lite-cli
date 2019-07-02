import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import {
	V3JSONKeyStore,
	Utils as KeystoreUtils,
	Keystore
} from 'evm-lite-keystore';
import { Utils } from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { ACCOUNT_UPDATE } from '../errors/accounts';
import { KEYSTORE } from '../errors/generals';

interface Options extends GenericOptions {
	interactive?: boolean;
	old?: string;
	new?: string;
}

export interface Arguments extends Args<Options> {
	address?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Update passphrase for a local account';

	return evmlc
		.command('accounts update [address]')
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
	address: string;
}

interface SecondAnswers {
	passphrase: string;
}

interface ThirdAnswers {
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

	const interactive = args.options.interactive || session.interactive;

	let keystores: V3JSONKeyStore[];

	staging.debug(
		`Attempting to read keystore directory at ${session.keystore.path}`
	);

	try {
		keystores = await session.keystore.list();

		staging.debug('Reading keystore successful.');
	} catch (e) {
		return Promise.reject(staging.error(KEYSTORE.LIST, e.toString()));
	}

	staging.debug(`Keystores length ${keystores.length}`);

	if (!keystores.length) {
		return Promise.reject(
			staging.error(
				KEYSTORE.EMPTY,
				`No accounts found in keystore directory ${
					session.keystore.path
				}`
			)
		);
	}

	const first: inquirer.Questions<FirstAnswers> = [
		{
			choices: keystores.map(keystore => keystore.address),
			message: 'Address: ',
			name: 'address',
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

	if (interactive && !args.address) {
		const { address } = await inquirer.prompt<FirstAnswers>(first);

		args.address = address;
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(ACCOUNT_UPDATE.ADDRESS_EMPTY, 'No address provided.')
		);
	}

	args.address = Utils.trimHex(args.address);

	staging.debug(`Address to update ${args.address}`);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				ACCOUNT_UPDATE.ADDRESS_INVALID_LENGTH,
				'Address provided has an invalid length.'
			)
		);
	}

	staging.debug(`Attempting to locate address ${args.address}`);

	try {
		await session.keystore.get(args.address);
	} catch (e) {
		return Promise.reject(
			staging.error(
				KEYSTORE.FETCH,
				`Could not locate keystore for address ${args.address} in ${
					session.keystore.path
				}`
			)
		);
	}

	staging.debug(`Successfully located address ${args.address}`);

	let oldPassphrase: string = '';
	let newPassphrase: string = '';

	if (!args.options.old && interactive) {
		const { passphrase } = await inquirer.prompt<SecondAnswers>(second);

		oldPassphrase = passphrase.trim();
	}

	if (!oldPassphrase) {
		if (!args.options.old) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.OLD_PWD_EMPTY,
					'Old passphrase file path not provided.'
				)
			);
		}

		staging.debug(`Old passphase path ${args.options.old}`);

		if (!KeystoreUtils.exists(args.options.old)) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.OLD_PWD_NOT_FOUND,
					'Old passphrase file path provided does not exist.'
				)
			);
		}

		if (KeystoreUtils.isDirectory(args.options.old)) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.OLD_PWD_IS_DIR,
					'Old passphrase file path provided is a directory.'
				)
			);
		}

		oldPassphrase = fs.readFileSync(args.options.old, 'utf8').trim();
	}

	staging.debug(`Received old passphrase`);
	staging.debug(`Attempting to decrypt ${args.address}`);

	try {
		const keystore = await session.keystore.get(args.address);

		Keystore.decrypt(keystore, oldPassphrase);

		staging.debug(`Decrypt was successful for ${args.address}`);
	} catch (e) {
		staging.debug(`Decrypt failed for ${args.address}`);

		return Promise.reject(staging.error(KEYSTORE.DECRYPTION, e.toString()));
	}

	if (!args.options.new && interactive) {
		const { passphrase, verifyPassphrase } = await inquirer.prompt<
			ThirdAnswers
		>(third);

		if (!(passphrase && verifyPassphrase)) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.PASS_FIELDS_BLANK,
					'Fields cannot be blank.'
				)
			);
		}

		staging.debug('Both new passphrase fields present');

		if (passphrase !== verifyPassphrase) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.PASS_FIELDS_BLANK,
					'Passphrases do not match.'
				)
			);
		}

		staging.debug('New passphrases match');

		newPassphrase = passphrase.trim();
	}

	if (!newPassphrase) {
		if (!args.options.new) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.NEW_PWD_EMPTY,
					'New passphrase file path not provided.'
				)
			);
		}

		staging.debug(`New passphase path ${args.options.new}`);

		if (!KeystoreUtils.exists(args.options.new)) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.NEW_PWD_NOT_FOUND,
					'New passphrase file path provided does not exist.'
				)
			);
		}

		if (KeystoreUtils.isDirectory(args.options.new)) {
			return Promise.reject(
				staging.error(
					ACCOUNT_UPDATE.NEW_PWD_IS_DIR,
					'Old passphrase file path provided is a directory.'
				)
			);
		}

		newPassphrase = fs.readFileSync(args.options.new, 'utf8').trim();
	}

	staging.debug(`Received new passphrase`);

	if (oldPassphrase === newPassphrase) {
		return Promise.reject(
			staging.error(
				ACCOUNT_UPDATE.SAME_OLD_NEW_PWD,
				'New passphrase cannot be the same as old.'
			)
		);
	}

	staging.debug(`New passphrase validated`);
	staging.debug(`Attempting to update passphrase for ${args.address}`);

	const newKeystore = await session.keystore.update(
		args.address,
		oldPassphrase,
		newPassphrase
	);

	staging.debug(`Successfully updated passphrase for ${args.address}`);

	return Promise.resolve(staging.success(newKeystore));
};
