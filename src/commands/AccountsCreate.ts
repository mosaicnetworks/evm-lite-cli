import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal from 'vorpal';

import { Utils, V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../classes/Session';
import Staging, { execute, StagingFunction } from '../classes/Staging';

interface AccountsCreatePrompt {
	password: string;
	verifyPassword: string;
}

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
			const { password, verifyPassword } = await inquirer.prompt<
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
		} else {
			if (!Utils.exists(args.options.pwd)) {
				resolve(
					staging.error(
						Staging.ERRORS.PATH_NOT_EXIST,
						'Password file provided does not exist.'
					)
				);
				return;
			}

			if (Utils.isDirectory(args.options.pwd)) {
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

		const account: V3JSONKeyStore = await session.keystore.create(
			args.options.pwd
		);

		resolve(staging.success(verbose ? account : `0x${account.address}`));
	});
};

export default function command(
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
		.option('-v, --verbose', 'show verbose output')
		.option('--pwd <file_path>', 'password file path')
		.types({
			string: ['pwd']
		})
		.action((args: Vorpal.Args) => execute(stage, args, session));
}
