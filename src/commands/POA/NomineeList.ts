import ASCIITable from 'ascii-table';
import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { Contract, Utils } from 'evm-lite-core';

import { POASchema } from './other/contract';

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
			}
		];

		const table = new ASCIITable();
		table.setHeading('Address');

		if (interactive) {
			const { from } = await inquirer.prompt(questions);

			args.options.from = from;
		}

		if (!args.options.from && !session.config.state.defaults.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No `from` address provided.'
				)
			);
			return;
		}

		await session.connect();

		const contract = Contract.load<POASchema>(poa.abi, poa.address);
		const transaction = contract.methods.getNomineeCount({
			from: Utils.cleanAddress(
				args.options.from || session.config.state.defaults.from
			),
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		});

		const response: any = await session.node.callTransaction(transaction);
		const whiteListCount = parseInt(response as string, 10);

		for (const i of Array.from(Array(whiteListCount).keys())) {
			const tx1 = contract.methods.getNomineeAddressFromIdx(
				{
					from: Utils.cleanAddress(
						args.options.from || session.config.state.defaults.from
					),
					gas: session.config.state.defaults.gas,
					gasPrice: session.config.state.defaults.gasPrice
				},
				i
			);

			const nomineeAddress: any = await session.node.callTransaction(tx1);
			const tx2 = contract.methods.getMoniker(
				{
					from: Utils.cleanAddress(
						args.options.from || session.config.state.defaults.from
					),
					gas: session.config.state.defaults.gas,
					gasPrice: session.config.state.defaults.gasPrice
				},
				nomineeAddress
			);

			const hexMoniker: any = await session.node.callTransaction(tx2);
			const moniker = hexToString(hexMoniker as string);

			table.addRow(nomineeAddress);
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
