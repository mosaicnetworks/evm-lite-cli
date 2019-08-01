import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import utils from 'evm-lite-utils';

import { V3Keyfile } from 'evm-lite-keystore';

import Session from '../Session';
import Frames, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../frames';

import { ACCOUNTS_CREATE } from '../errors/accounts';

interface Options extends IOptions {
	interactive?: boolean;
	debug?: boolean;
	pwd?: string;
	out?: string;
}

export interface Arguments extends Args<Options> {
	moniker?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Creates an encrypted keypair locally';

	return evmlc
		.command('accounts create [moniker]')
		.alias('a c')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('--pwd <file_path>', 'passphrase file path')
		.option('--out <output_path>', 'write keystore to output path')
		.types({
			string: ['_', 'pwd', 'out']
		})
		.action((args: Arguments) => execute(stage, args, session));
}

interface Answers {
	moniker: string;
	outpath: string;
	passphrase: string;
	verifyPassphrase: string;
}

export type Output = IStagedOutput<Arguments, V3Keyfile, V3Keyfile>;

export const stage: IStagingFunction<Arguments, V3Keyfile, V3Keyfile> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, V3Keyfile, V3Keyfile>(session, args);

	// args
	const { options } = args;

	// decontruct
	const { success, error, debug } = frames.staging();

	/** Command Execution */
	let passphrase: string = '';

	const interactive = options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
		{
			message: 'Moniker: ',
			name: 'moniker',
			type: 'input'
		},
		{
			message: 'Output Path: ',
			name: 'outpath',
			type: 'input',
			default: session.keystore.path
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

	if (interactive) {
		const answers = await inquirer.prompt<Answers>(questions);

		debug(`Moniker received: ${answers.moniker || 'null'}`);
		debug(`Output Path received: ${answers.outpath || 'null'}`);
		debug(`Passphrase received: ${answers.passphrase || 'null'}`);
		debug(
			`Verify passphrase received: ${answers.verifyPassphrase || 'null'}`
		);

		if (!(answers.passphrase && answers.verifyPassphrase)) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.PASS_FIELDS_BLANK,
					'Fields cannot be blank'
				)
			);
		}

		if (answers.passphrase !== answers.verifyPassphrase) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.PASS_DO_NOT_MATCH,
					'Passphrases do not match'
				)
			);
		}

		args.moniker = answers.moniker;
		options.out = answers.outpath;

		passphrase = answers.passphrase.trim();

		debug(`Passphrase set: ${passphrase}`);
	}

	if (!args.moniker) {
		return Promise.reject(
			error(ACCOUNTS_CREATE.EMPTY_MONIKER, 'Moniker cannot be empty')
		);
	}

	if (!utils.validMoniker(args.moniker)) {
		return Promise.reject(
			error(
				ACCOUNTS_CREATE.INVALID_MONIKER,
				'Moniker contains illegal characters'
			)
		);
	}

	if (!passphrase) {
		debug(`Passphrase file path: ${options.pwd || 'null'}`);

		if (!options.pwd) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.PWD_PATH_EMPTY,
					'No passphrase file path provided'
				)
			);
		}

		if (!utils.exists(options.pwd)) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (utils.isDirectory(options.pwd)) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.PWD_IS_DIR,
					'passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(options.pwd, 'utf8').trim();

		debug(`Passphrase read successfully: ${passphrase}`);
	}

	if (options.out) {
		debug(`Output path: ${options.out || 'null'}`);

		if (!utils.exists(options.out)) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.OUT_PATH_NOT_FOUND,
					'Output path provided does not exist.'
				)
			);
		}

		if (!utils.isDirectory(options.out)) {
			return Promise.reject(
				error(
					ACCOUNTS_CREATE.OUT_PATH_IS_NOT_DIR,
					'Output path provided is a not a directory.'
				)
			);
		}

		debug(`Output path verified: ${options.out}`);
	}

	debug(`Attempting to create account...`);

	let account: V3Keyfile;
	try {
		account = await session.keystore.create(
			args.moniker,
			passphrase,
			options.out
		);
	} catch (e) {
		return Promise.reject(
			error(ACCOUNTS_CREATE.KEYSTORE_CREATE, e.toString())
		);
	}

	debug(
		`Account creation successful: ${utils.cleanAddress(account.address)}`
	);

	return Promise.resolve(success(account));
};
