/**
 * @file AccountsCreate.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2019
 */

import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as JSONBig from 'json-bigint';
import * as Vorpal from 'vorpal';

import { Static, V3JSONKeyStore } from 'evm-lite-lib';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

interface AccountsCreatePrompt {
	output: string;
	password: string;
	verifyPassword: string;
}

/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `accounts create`
 * command and resolve a success or an error.
 *
 * @param args - Arguments to the command.
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export const stage: StagingFunction<V3JSONKeyStore, string> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<V3JSONKeyStore, string>(args);

		const interactive = !args.options.pwd || session.interactive;
		const verbose = args.options.verbose || false;
		const questions = [
			{
				default: session.keystore.path,
				message: 'Enter keystore output path: ',
				name: 'output',
				type: 'input'
			},
			{
				message: 'Enter a password: ',
				name: 'password',
				type: 'password'
			},
			{
				message: 'Re-enter password: ',
				name: 'verifyPassword',
				type: 'password'
			}
		];

		if (interactive) {
			const { output, password, verifyPassword } = await inquirer.prompt<
				AccountsCreatePrompt
			>(questions);
			if (!(password && verifyPassword && password === verifyPassword)) {
				resolve(
					staging.error(
						Staging.ERRORS.BLANK_FIELD,
						'Passwords either blank or do not match.'
					)
				);
				return;
			}

			args.options.pwd = password.trim();
			args.options.output = output;
		} else {
			if (!Static.exists(args.options.pwd)) {
				resolve(
					staging.error(
						Staging.ERRORS.PATH_NOT_EXIST,
						'Password file provided does not exist.'
					)
				);
				return;
			}

			if (Static.isDirectory(args.options.pwd)) {
				resolve(
					staging.error(
						Staging.ERRORS.IS_DIRECTORY,
						'Password file path provided is a directory.'
					)
				);
				return;
			}

			args.options.pwd = fs.readFileSync(args.options.pwd, 'utf8').trim();
		}

		args.options.output =
			args.options.output || session.config.data.storage.keystore;
		if (!Static.exists(args.options.output)) {
			resolve(
				staging.error(
					Staging.ERRORS.DIRECTORY_NOT_EXIST,
					'Output directory does not exist.'
				)
			);
			return;
		}

		if (!Static.isDirectory(args.options.output)) {
			resolve(
				staging.error(
					Staging.ERRORS.IS_FILE,
					'Output path is not a directory.'
				)
			);
			return;
		}

		const account: V3JSONKeyStore = JSONBig.parse(
			await session.keystore.create(args.options.pwd, args.options.output)
		);

		resolve(staging.success(verbose ? account : `0x${account.address}`));
	});
};

/**
 * Should construct a Vorpal.Command instance for the command `accounts create`.
 *
 * @remarks
 * Allows you to create and encrypt accounts locally. Created accounts will
 * either be placed in the keystore folder provided by default config file
 * (located at `~/.evmlc/config.toml`) or the config file located in the
 * `--datadir, -d` flag.
 *
 * Usage:
 * `accounts create --verbose --output ~/datadir/keystore --pwd ~/datadir/pwd.txt`
 *
 * Here we have specified to create the account file in `~/datadir/keystore`,
 * encrypt with the `~/datadir/pwd.txt` and once that is done, provide the
 * verbose output of the created account.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandAccountsCreate(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description =
		'Allows you to create and encrypt accounts locally. Created accounts' +
		' will either be placed in the' +
		' keystore folder inside the data directory provided by the global' +
		'--datadir, -d flag or if no flag is' +
		' provided, in the keystore specified in the configuration file.';

	return evmlc
		.command('accounts create')
		.alias('a c')
		.description(description)
		.option('-o, --output <path>', 'keystore file output path')
		.option('-v, --verbose', 'show verbose output')
		.option('--pwd <file_path>', 'password file path')
		.types({
			string: ['pwd', 'o', 'output']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
