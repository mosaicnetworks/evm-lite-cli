import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3Keyfile } from 'evm-lite-keystore';

import Session from '../Session';
import Frames, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../frames';

import { ACCOUNTS_IMPORT } from '../errors/accounts';
import { ConfigurationSchema } from 'evm-lite-datadir';

interface Options extends IOptions {
	interactive?: boolean;
	default?: boolean;
	file?: string;
}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Import an encrypted keyfile to the keystore';

	return evmlc
		.command('accounts import')
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
}

interface Answers {
	file: string;
	makeDefault: boolean;
}

export type Output = IStagedOutput<Arguments, V3Keyfile, V3Keyfile>;

export const stage: IStagingFunction<Arguments, V3Keyfile, V3Keyfile> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, V3Keyfile, V3Keyfile>(session, args);

	// prepare
	const { options } = args;
	const { success, error, debug } = frames.staging();

	/** Command Execution */
	const interactive = options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
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
		const { file, makeDefault } = await inquirer.prompt<Answers>(questions);

		debug(`Keyfile path: ${file || 'null'}`);

		options.file = file;
		options.default = makeDefault || false;
	}

	if (!options.file) {
		return Promise.reject(
			error(ACCOUNTS_IMPORT.FILE_PATH_EMPTY, '--file path not provided.')
		);
	}

	if (!Utils.exists(options.file)) {
		return Promise.reject(
			error(
				ACCOUNTS_IMPORT.FILE_PATH_NOT_FOUND,
				'--file path provided does not exist.'
			)
		);
	}

	if (Utils.isDirectory(options.file)) {
		return Promise.reject(
			error(
				ACCOUNTS_IMPORT.FILE_IS_DIR,
				'--file path provided is a directory.'
			)
		);
	}

	debug(`Keyfile path verified: ${options.file}`);

	let keystore: V3Keyfile;

	debug(`Keystore directory: ${session.keystore.path}`);
	debug(`Attempting to import keyfile...`);

	try {
		keystore = JSON.parse(fs.readFileSync(path.join(options.file), 'utf8'));
	} catch (e) {
		return Promise.reject(e);
	}

	const filename = `UTC--${JSON.stringify(new Date())}--${keystore.address}`
		.replace(/"/g, '')
		.replace(/:/g, '-');

	fs.writeFileSync(
		path.join(session.keystore.path, filename),
		JSON.stringify(keystore)
	);

	debug(`Setting as default address...`);

	if (options.default) {
		const newConfig: ConfigurationSchema = {
			...session.config.state,
			defaults: {
				...session.config.state.defaults,
				from: Utils.cleanAddress(keystore.address)
			}
		};

		await session.config.save(newConfig);
	}

	return Promise.resolve(success(keystore));
};
