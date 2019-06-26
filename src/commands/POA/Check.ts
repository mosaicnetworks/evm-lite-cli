import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { Contract, Utils } from 'evm-lite-core';

import { POASchema } from './other/contract';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	from: string;
	nominee: string;
}

export const stage: StagingFunction<any, any> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		console.log(args);
		const staging = new Staging<any, any>(args);

		const status = await session.connect();
		if (!status) {
			staging.error(
				Staging.ERRORS.INVALID_CONNECTION,
				'Could not connect to node.'
			);
		}

		const interactive = args.options.interactive || session.interactive;
		const poa = await session.getPOAContract();
		const accounts = await session.keystore.list();

		const questions = [
			{
				choices: accounts.map(account => account.address),
				message: 'Enter From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Enter nominee address: ',
				name: 'nominee',
				type: 'input'
			}
		];

		if (interactive && !args.address) {
			const { nominee, from } = await inquirer.prompt<NominateAnswers>(
				questions
			);

			args.address = nominee;
			args.options.from = from;
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

		if (!args.options.from && !session.config.state.defaults.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No from address provided or set in config.'
				)
			);
			return;
		}
		const contract = Contract.load<POASchema>(poa.abi, poa.address);
		const transaction = contract.methods.checkAuthorised(
			{
				from: args.options.from || session.config.state.defaults.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(args.address)
		);

		console.log(transaction);

		try {
			const response = await session.node.callTransaction(transaction);
			resolve(staging.success(response));
		} catch (e) {
			resolve(staging.error(Staging.ERRORS.OTHER, e.toString()));
		}
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Check whether a nominee was accepted';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--from <address>', 'from address')
		.types({
			string: ['_', 'from']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
