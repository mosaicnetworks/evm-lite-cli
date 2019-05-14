import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Keystore, Static, TXReceipt } from 'evm-lite-lib';

import { POA_ABI, POA_BYTECODE, POASchema } from './other/constants';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	nominee: string;
	moniker: string;
	password: string;
}

export const stage: StagingFunction<TXReceipt, TXReceipt> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async (resolve, reject) => {
		const staging = new Staging<TXReceipt, TXReceipt>(args);

		const interactive = args.options.interactive || session.interactive;
		const connection = await session.connect();
		const questions = [
			{
				message: 'Enter address to nominate: ',
				name: 'nominee',
				type: 'input'
			},
			{
				message: 'Enter a moniker: ',
				name: 'nominee',
				type: 'input'
			},
			{
				message: 'Enter a password: ',
				name: 'password',
				type: 'password'
			}
		];

		if (interactive) {
			const { nominee, password, moniker } = await inquirer.prompt<
				NominateAnswers
			>(questions);

			args.options.pwd = password.trim();
			args.options.nominee = nominee;
			args.options.moniker = moniker;
		}

		if (!args.options.pwd) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No password provided.'
				)
			);
			return;
		}

		if (!args.options.nominee) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No nominee address provided.'
				)
			);
			return;
		}

		if (!args.options.moniker) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No moniker provided.'
				)
			);
			return;
		}

		const keystore = new Keystore(session.config.data.storage.keystore);
		const account = await keystore.decrypt(
			session.config.data.defaults.from.toLowerCase(),
			args.options.pwd,
			session.connection
		);

		const contract = session.connection.contracts.load<POASchema>(
			JSON.parse(POA_ABI),
			{
				contractAddress: '0xf213fad3daab5b18c19c36117bf6174249f6c214'
			}
		);

		const transaction = contract.methods.submitNominee(
			Static.cleanAddress(args.options.nominee),
			'moniker'
		);

		await transaction.submit(account, {
			timeout: 3
		});

		resolve(staging.success(await transaction.receipt));
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description =
		'Allows you to nominate an address to go through election';

	return evmlc
		.command('poa nominate')
		.alias('p n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--pwd <password>', 'text password')
		.option('--nominee <nominee>', 'nominee address')
		.option('--moniker <moniker>', 'moniker for nominee')
		.types({
			string: ['pwd', 'nominee', 'moniker']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
