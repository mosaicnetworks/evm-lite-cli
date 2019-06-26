import ASCIITable from 'ascii-table';
import Vorpal from 'vorpal';

import { BaseAccount } from 'evm-lite-core';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

export const stage: StagingFunction<ASCIITable, BaseAccount[]> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<ASCIITable, BaseAccount[]>(args);

		const remote = args.options.remote || false;
		const verbose = args.options.verbose || false;
		const formatted = args.options.formatted || false;
		const table = new ASCIITable();

		if (verbose || remote) {
			const status = await session.connect(
				args.options.host,
				args.options.port
			);

			if (!status) {
				resolve(staging.error(Staging.ERRORS.INVALID_CONNECTION));
				return;
			}
		}

		const accounts = await Promise.all(
			(await session.keystore.list()).map(async keystore => {
				if (verbose || remote) {
					return await session.node.getAccount(keystore.address);
				} else {
					return Promise.resolve({
						address: keystore.address,
						balance: 0,
						nonce: 0,
						bytecode: ''
					});
				}
			})
		);

		if (!accounts || !accounts.length) {
			resolve(staging.success([]));
			return;
		}

		if (!formatted) {
			resolve(staging.success(accounts));
			return;
		}

		verbose
			? table.setHeading('Address', 'Balance', 'Nonce')
			: table.setHeading('Address');
		for (const account of accounts) {
			verbose
				? table.addRow(
						account.address,
						account.balance.toString(10),
						account.nonce
				  )
				: table.addRow(account.address);
		}

		resolve(staging.success(table));
	});
};

export default function command(evmlc: Vorpal, session: Session) {
	const description =
		'List all accounts in the local keystore directory provided by the ' +
		'configuration file. This command will also get a balance and nonce ' +
		'for all the accounts from the node if a valid connection is ' +
		'established.';

	return evmlc
		.command('accounts list')
		.alias('a l')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option(
			'-v, --verbose',
			'verbose output (fetches balance & nonce from node)'
		)
		.option('-r, --remote', 'list remote accounts')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
