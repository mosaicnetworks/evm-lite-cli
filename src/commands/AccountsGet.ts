import * as inquirer from 'inquirer';

import Vorpal from 'vorpal';
import ASCIITable from 'ascii-table';

import { BaseAccount } from 'evm-lite-core';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

interface AccountsGetPrompt {
	address: string;
}

export const stage: StagingFunction<ASCIITable, BaseAccount> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<ASCIITable, BaseAccount>(args);
		const status = await session.connect(
			args.options.host,
			args.options.port
		);

		if (!status) {
			resolve(staging.error(Staging.ERRORS.INVALID_CONNECTION));
			return;
		}

		const interactive = args.options.interactive || session.interactive;
		const formatted = args.options.formatted || false;
		const questions = [
			{
				message: 'Address: ',
				name: 'address',
				required: true,
				type: 'input'
			}
		];

		if (interactive && !args.address) {
			const { address } = await inquirer.prompt<AccountsGetPrompt>(
				questions
			);
			args.address = address;
		}

		if (!args.address) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'Provide a non-empty address.'
				)
			);
			return;
		}

		const account = await session.node.getAccount(args.address);
		if (!account) {
			resolve(
				staging.error(
					Staging.ERRORS.FETCH_FAILED,
					'Could not fetch account: ' + args.address
				)
			);
			return;
		}

		const table: ASCIITable = new ASCIITable().setHeading(
			'Address',
			'Balance',
			'Nonce',
			'Bytecode'
		);

		if (formatted) {
			table.addRow(
				account.address,
				account.balance.toString(10),
				account.nonce,
				account.bytecode
			);
		}

		resolve(staging.success(formatted ? table : account));
	});
};

export default function command(evmlc: Vorpal, session: Session) {
	const description =
		'Gets account balance and nonce from a node with a valid connection.';

	return evmlc
		.command('accounts get [address]')
		.alias('a g')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-i, --interactive', 'use interactive mode')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['_', 'h', 'host']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
