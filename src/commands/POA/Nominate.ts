import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { Contract, Utils } from 'evm-lite-core';
import { Keystore } from 'evm-lite-keystore';

import { POASchema } from './other/contract';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface NominateAnswers {
	nominee: string;
	moniker: string;
	password: string;
	from: string;
}

function hexToString(hex: string) {
	let data = '';

	for (let i = 0; i < hex.length; i += 2) {
		data += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}

	return data;
}

export const stage: StagingFunction<string, string> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async (resolve, reject) => {
		const staging = new Staging<string, string>(args);
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
				message: 'Enter address to nominate: ',
				name: 'nominee',
				type: 'input'
			},
			{
				message: 'Enter a moniker: ',
				name: 'moniker',
				type: 'input'
			}
		];

		if (interactive) {
			console.log('Interactive');
			const { nominee, password, moniker, from } = await inquirer.prompt<
				NominateAnswers
			>(questions);

			args.options.from = from;
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

		if (!args.options.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `from` address provided.'
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

		const account = await Keystore.decrypt(
			await session.keystore.get(args.options.from),
			args.options.pwd
		);

		const contract = Contract.load<POASchema>(poa.abi, poa.address);
		const transaction = contract.methods.submitNominee(
			{
				from: args.options.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(args.options.nominee),
			args.options.moniker
		);

		console.log(transaction);

		try {
			const receipt = await session.node.sendTransaction(
				transaction,
				account
			);
			const parsedLogs = receipt.logs;

			console.log(receipt);
			console.log(parsedLogs);

			if (parsedLogs.length > 0) {
				const nomineeProposedEvent = parsedLogs[0];
				const monikerAnnouceEvent = parsedLogs[1];

				const returnData = `You (${
					nomineeProposedEvent.args._proposer
				}) nominated '${hexToString(
					monikerAnnouceEvent.args._moniker
				)}' (${nomineeProposedEvent.args._nominee})`;

				resolve(staging.success(returnData));
			} else {
				resolve(
					staging.error(
						Staging.ERRORS.OTHER,
						'Looks like you are not authorised to use this command.'
					)
				);
			}
		} catch (e) {
			resolve(staging.error(Staging.ERRORS.OTHER, e.toString()));
		}
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Nominate an address to go through election';

	return evmlc
		.command('poa nominate')
		.alias('p n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--pwd <password>', 'text password')
		.option('--nominee <nominee>', 'nominee address')
		.option('--moniker <moniker>', 'moniker for nominee')
		.option('--from <address>', 'from address')
		.types({
			string: ['pwd', 'nominee', 'moniker', 'from']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
