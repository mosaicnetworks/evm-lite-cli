// Needs finishing

import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Keystore, Static, TXReceipt } from 'evm-lite-lib';

import { POA_ABI, POA_BYTECODE, POASchema } from './other/constants';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	nominee: string;
	verdict: boolean;
	password: string;
}

export const stage: StagingFunction<any, any> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async (resolve, reject) => {
		const staging = new Staging<any, any>(args);

		const interactive = args.options.interactive || session.interactive;
		const connection = await session.connect();
		const questions = [
			{
				message: 'Address: ',
				name: 'nominee',
				type: 'input'
			},
			{
				message: 'Verdict: ',
				name: 'verdict',
				type: 'confirm'
			},
			{
				message: 'Enter a password: ',
				name: 'password',
				type: 'password'
			}
		];

		if (interactive) {
			const { nominee, verdict, password } = await inquirer.prompt<
				NominateAnswers
			>(questions);

			args.options.address = nominee;
			args.options.verdict = verdict;
			args.options.pwd = password.trim();
		}

		if (!args.options.address) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No address provided.'
				)
			);
			return;
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

		if (args.options.verdict === undefined) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No verdict provided.'
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

		const transaction = contract.methods.castNomineeVote(
			Static.cleanAddress(args.options.address),
			args.options.verdict
		);

		await transaction.submit(account, { timeout: 3 });

		resolve(staging.success(await transaction.receipt));
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Allows you to vote for an address.';

	return evmlc
		.command('poa vote')
		.alias('p v')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--address <address>', 'address to vote for')
		.option('--verdict <boolean>', 'verdict for given address')
		.option('--pwd <password>', 'text password')
		.types({
			string: ['address']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
