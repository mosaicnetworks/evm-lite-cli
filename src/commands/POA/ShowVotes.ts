import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { Contract, Utils } from 'evm-lite-core';

import { POASchema } from './other/contract';

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
		const status = await session.connect();

		if (!status) {
			staging.error(
				Staging.ERRORS.INVALID_CONNECTION,
				'Could not connect to node.'
			);
		}

		const poa = await session.getPOAContract();
		const interactive = args.options.interactive || session.interactive;
		const questions = [
			{
				message: 'Enter address: ',
				name: 'nominee',
				type: 'input'
			}
		];

		if (interactive && !args.address) {
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

		const contract = Contract.load<POASchema>(poa.abi, poa.address);

		try {
			const transaction = contract.methods.dev_getCurrentNomineeVotes(
				{
					from: session.config.state.defaults.from,
					gas: session.config.state.defaults.gas,
					gasPrice: session.config.state.defaults.gasPrice
				},
				Utils.cleanAddress(args.address)
			);

			console.log(transaction);

			const response = await session.node.callTransaction(transaction);
			resolve(staging.success(response));
		} catch (e) {
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
		.alias('p sv')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.types({
			string: ['_']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
