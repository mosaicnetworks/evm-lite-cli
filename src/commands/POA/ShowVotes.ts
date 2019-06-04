import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Keystore, Static, TXReceipt } from 'evm-lite-lib';

import {
	POA_ABI,
	POA_ADDRESS,
	POA_BYTECODE,
	POASchema
} from './other/constants';

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
				contractAddress: POA_ADDRESS
			}
		);

		try {
			const transaction = contract.methods.dev_getCurrentNomineeVotes(
				Static.cleanAddress(args.address)
			);

			const response = await transaction.submit();

			resolve(staging.success(response));
		} catch (e) {
			console.log(e);
			resolve(e.text);
		}
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Shows the number of yes and no votes';

	return evmlc
		.command('poa showvotes [address]')
		.alias('p s')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.types({
			string: ['_']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
