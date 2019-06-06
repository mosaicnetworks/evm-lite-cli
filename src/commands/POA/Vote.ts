// Needs finishing

import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Contract, Utils } from 'evm-lite-core';
import { Keystore } from 'evm-lite-keystore';

import { POA_ABI, POA_ADDRESS, POASchema } from './other/contract';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	nominee: string;
	verdict: boolean;
	from: string;
	password: string;
}

export const stage: StagingFunction<any, any> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async (resolve, reject) => {
		const staging = new Staging<any, any>(args);

		const interactive = args.options.interactive || session.interactive;

		await session.connect();

		const accounts = await session.keystore.list();
		const questions = [
			{
				choices: accounts.map(account => account.address),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Enter a password: ',
				name: 'password',
				type: 'password'
			},
			{
				message: 'Address: ',
				name: 'nominee',
				type: 'input'
			},
			{
				message: 'Verdict: ',
				name: 'verdict',
				type: 'confirm'
			}
		];

		if (interactive) {
			const { nominee, verdict, password, from } = await inquirer.prompt<
				NominateAnswers
			>(questions);

			args.options.from = from;
			args.options.address = nominee;
			args.options.verdict = verdict;
			args.options.pwd = password.trim();
		}

		if (!args.options.address) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `nominee` address provided.'
				)
			);
			return;
		}

		if (!args.options.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `from` address provided.'
				)
			);
			return;
		}

		if (!args.options.pwd) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `password` provided.'
				)
			);
			return;
		}

		if (args.options.verdict === undefined) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `verdict` provided.'
				)
			);
			return;
		}

		const account = await Keystore.decrypt(
			await session.keystore.get(args.options.from),
			args.options.pwd
		);

		const contract = Contract.load<POASchema>(
			JSON.parse(POA_ABI),
			POA_ADDRESS
		);

		const transaction = contract.methods.castNomineeVote(
			{
				from: args.options.from || session.config.state.defaults.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(args.options.address),
			args.options.verdict
		);

		console.log(transaction);

		await session.node.sendTransaction(transaction, account);

		const receipt = transaction.receipt;
		const parsedLogs = receipt.logs;

		console.log(receipt);
		console.log(parsedLogs);

		if (parsedLogs.length) {
			let nomineeDecisionEvent: any;

			const nomineeVoteCastEvent = parsedLogs[0];

			if (parsedLogs.length > 1) {
				nomineeDecisionEvent = parsedLogs[1];
			}
			const vote = nomineeVoteCastEvent.args._accepted ? 'Yes' : 'No';
			let message = `You (${
				nomineeVoteCastEvent.args._voter
			}) voted '${vote}' for '${nomineeVoteCastEvent.args._nominee}'. `;

			if (nomineeDecisionEvent) {
				const accepted = nomineeDecisionEvent.args._accepted
					? 'Accepted'
					: 'Rejected';

				message += `Election completed with the nominee being '${accepted}'.`;
			}

			resolve(staging.success(message));
		} else {
			resolve(
				staging.error(
					Staging.ERRORS.OTHER,
					'Looks like the nominee is no longer ' +
						'pending or you do not have permission.'
				)
			);
		}
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Vote for an nominee currently in election.';

	return evmlc
		.command('poa vote')
		.alias('p v')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--address <address>', 'address to vote for')
		.option('--verdict <boolean>', 'verdict for given address')
		.option('--pwd <password>', 'text password')
		.option('--from <address>', 'from address')
		.types({
			string: ['address', 'from']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
