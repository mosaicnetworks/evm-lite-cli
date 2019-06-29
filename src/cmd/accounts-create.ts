import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import { Utils, V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import {
	InvalidArgumentError,
	PathNotFoundError,
	InvalidPathError
} from '../errors';

interface Options extends GenericOptions {
	interactive?: boolean;
	debug?: boolean;
	pwd?: string;
	out?: string;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Creates an encrypted keypair locally';

	return evmlc
		.command('accounts create')
		.alias('a c')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--pwd <file_path>', 'passphrase file path')
		.option('--out <output_path>', 'write keystore to output path')
		.types({
			string: ['pwd', 'out']
		})
		.action((args: Arguments) => execute(stage, args, session));
}

interface Answers {
	passphrase: string;
	verifyPassphrase: string;
}

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

	if (interactive) {
		const answers = await inquirer.prompt<Answers>(questions);

		if (!(answers.passphrase && answers.verifyPassphrase)) {
			return Promise.reject(
				new InvalidArgumentError('Fields cannot be blank.')
			);
		}

		staging.debug('Both passphrase fields present');

		if (answers.passphrase !== answers.verifyPassphrase) {
			return Promise.reject(
				new InvalidArgumentError('Passphrases do not match.')
			);
		}

		staging.debug('Passphrases match');

		passphrase = answers.passphrase.trim();
	}

	if (!passphrase) {
		if (!args.options.pwd) {
			return Promise.reject(
				new InvalidArgumentError('No passphrase file path provided.')
			);
		}

		staging.debug(`Passphrase file path detected ${args.options.pwd}`);

		if (!Utils.exists(args.options.pwd)) {
			return Promise.reject(
				new PathNotFoundError(
					'Passphrase file path provided does not exist.'
				)
			);
		}

		staging.debug(`Passphrase file exists`);

		if (Utils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				new InvalidPathError(
					'passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Passphrase read successfully`);
	}

	if (args.options.out) {
		staging.debug(`Output path detected ${args.options.out}`);

		if (!Utils.exists(args.options.out)) {
			return Promise.reject(
				new PathNotFoundError('Output path provided does not exist.')
			);
		}

		staging.debug(`Output path exists`);

		if (!Utils.isDirectory(args.options.out)) {
			return Promise.reject(
				new InvalidPathError(
					'Output path provided is a not a directory.'
				)
			);
		}
	}

	const account: V3JSONKeyStore = await session.keystore.create(
		passphrase,
		args.options.out
	);

	staging.debug(
		`Successfully written encrypted account to ${args.options.out ||
			session.keystore.path}`
	);

	return Promise.resolve(staging.success(account));
};
