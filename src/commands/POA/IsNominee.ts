import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

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
		await session.connect();

		const staging = new Staging<any, any>(args);
		const interactive = args.options.interactive || session.interactive;
		const poa = await session.node.getContract();
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

		const contract = Contract.load<POASchema>(poa.abi, poa.address);
		const transaction = contract.methods.isNominee(
			{
				from: session.config.state.defaults.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(args.address)
		);

		const response = await session.node.callTransaction(transaction);

		resolve(staging.success(response));
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Checks whether an address is a nominee';

	return evmlc
		.command('poa isnominee [address]')
		.alias('p i')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.types({
			string: ['_']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
