/**
 * @file AccountsGet.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2019
 */

import * as ASCIITable from 'ascii-table';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { BaseAccount } from 'evm-lite-lib';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

interface AccountsGetPrompt {
	address: string;
}

/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `accounts get`
 * command and resolve a success or an error.
 *
 * @param args - Arguments to the command. @link
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export const stage: StagingFunction<ASCIITable, BaseAccount> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<ASCIITable, BaseAccount>(args);

		const connection = await session.connect(
			args.options.host,
			args.options.port
		);
		if (!connection) {
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

		const account = await connection.accounts.getAccount(args.address);
		if (!account) {
			resolve(
				staging.error(
					Staging.ERRORS.FETCH_FAILED,
					'Could not fetch account: ' + args.address
				)
			);
			return;
		}

		const table = new ASCIITable().setHeading(
			'Address',
			'Balance',
			'Nonce'
		);
		if (formatted) {
			table.addRow(account.address, account.balance, account.nonce);
		}

		resolve(staging.success(formatted ? table : account));
	});
};

/**
 * Should construct a Vorpal.Command instance for the command `accounts get`.
 *
 * @remarks
 * Allows you to get account details such as balance and nonce from the
 * blockchain.
 *
 * Usage: `accounts get --formatted 0x583560ee73713a6554c463bd02349841cd79f6e2`
 *
 * The above command will get the account balance and nonce from the node and
 * format the returned JSON into an ASCII table.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts get`.
 *
 * @alpha
 */
export default function commandAccountsGet(evmlc: Vorpal, session: Session) {
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
