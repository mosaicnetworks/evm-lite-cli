import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';
import * as ASCIITable from 'ascii-table';

import { Static } from 'evm-lite-lib';

import { POA_ABI, POA_ADDRESS, POASchema } from './other/constants';

import Session from '../../classes/Session';
import Staging, { execute, StagingFunction } from '../../classes/Staging';

interface Answers {
	from: string;
}

function hexToString(hex: string) {
	let data = '';

	for (let i = 0; i < hex.length; i += 2) {
		data += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}

	return data;
}

export const stage: StagingFunction<any, any> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async (resolve, reject) => {
		const staging = new Staging<any, any>(args);

		const interactive = args.options.interactive || session.interactive;
		const accounts = await session.keystore.list();
		const questions = [
			{
				choices: accounts.map(account => account.address),
				message: 'From: ',
				name: 'from',
				type: 'list'
			}
		];

		const table = new ASCIITable();
		table.setHeading('Moniker', 'Address', 'Proposer');

		if (interactive) {
			const { from } = await inquirer.prompt(questions);

			args.options.from = from;
		}

		if (!args.options.from && !session.config.data.defaults.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `from` address provided.'
				)
			);
			return;
		}

		await session.connect();

		const contract = session.connection.contracts.load<POASchema>(
			JSON.parse(POA_ABI),
			{
				contractAddress: POA_ADDRESS
			}
		);

		const transaction = contract.methods
			.getNomineeCount()
			.from(
				Static.cleanAddress(
					args.options.from || session.config.data.defaults.from
				)
			);

		const response: any = await transaction.submit();
		const whiteListCount = parseInt(response as string, 10);

		for (const i of Array(whiteListCount).keys()) {
			const _transaction = contract.methods
				.getNomineeAddressFromIdx(i)
				.from(
					Static.cleanAddress(
						args.options.from || session.config.data.defaults.from
					)
				);

			const nomineeAddress: any = await _transaction.submit();
			const __transaction = contract.methods
				.getMoniker(nomineeAddress)
				.from(
					Static.cleanAddress(
						args.options.from || session.config.data.defaults.from
					)
				);

			const hexMoniker: any = await __transaction.submit();
			const moniker = hexToString(hexMoniker as string);

			table.addRow(moniker, nomineeAddress);
		}

		resolve(staging.success(table));
	});
};

export default function command(
	evmlc: Vorpal,
	session: Session
): Vorpal.Command {
	const description = 'Show the entire nominee list with moniker';

	return evmlc
		.command('poa nomineelist')
		.alias('p nl')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--from <address>', 'from address')
		.types({
			string: ['from']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
