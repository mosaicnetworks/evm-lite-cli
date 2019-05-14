import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Keystore, Static, TXReceipt } from 'evm-lite-lib';

import { POA_ABI, POA_BYTECODE, POASchema } from './other/constants';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	nominee: string;
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
				message: 'Enter address: ',
				name: 'nominee',
				type: 'input'
			}
		];

		if (interactive) {
			const { nominee } = await inquirer.prompt<NominateAnswers>(
				questions
			);

			args.address = nominee;
		}

		if (!args.address) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No nominee address provided.'
				)
			);
			return;
		}

		const contract = session.connection.contracts.load<POASchema>(
			JSON.parse(POA_ABI),
			{
				contractAddress: '0xf213fad3daab5b18c19c36117bf6174249f6c214'
			}
		);

		const transaction = contract.methods.checkAuthorised(
			Static.cleanAddress(args.address)
		);

		const response = await transaction.submit();

		resolve(staging.success(response));
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Allows you to check whether a nominee was accepted';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.types({
			string: ['']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}