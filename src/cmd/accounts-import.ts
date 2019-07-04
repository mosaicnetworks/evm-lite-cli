import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { ACCOUNTS_IMPORT } from '../errors/accounts';
import { ConfigurationSchema } from 'evm-lite-datadir';

interface Options extends GenericOptions {
	interactive?: boolean;
	default?: boolean;
	file?: string;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

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

	if (interactive && !args.options.file) {
		const { file, makeDefault } = await inquirer.prompt<Answers>(questions);

		staging.debug(`Keyfile path: ${file || 'null'}`);

		args.options.file = file;
		args.options.default = makeDefault || false;
	}

	if (!args.options.file) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_IMPORT.FILE_PATH_EMPTY,
				'--file path not provided.'
			)
		);
	}

	if (!Utils.exists(args.options.file)) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_IMPORT.FILE_PATH_NOT_FOUND,
				'--file path provided does not exist.'
			)
		);
	}

	if (Utils.isDirectory(args.options.file)) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_IMPORT.FILE_IS_DIR,
				'--file path provided is a directory.'
			)
		);
	}

	staging.debug(`Keyfile path verified: ${args.options.file}`);

	let keystore: V3JSONKeyStore;

	staging.debug(`Keystore directory: ${session.keystore.path}`);
	staging.debug(`Attempting to import keyfile...`);

	try {
		keystore = JSON.parse(
			fs.readFileSync(path.join(args.options.file), 'utf8')
		);
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

	staging.debug(`Setting as default address...`);

	if (args.options.default) {
		const newConfig: ConfigurationSchema = {
			...session.config.state,
			defaults: {
				...session.config.state.defaults,
				from: Utils.cleanAddress(keystore.address)
			}
		};

		await session.config.save(newConfig);
	}

	return Promise.resolve(staging.success(keystore));
};
