import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import { BaseAccount } from 'evm-lite-core';
import { V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { InvalidConnectionError } from '../errors';

interface Options extends GenericOptions {
	formatted?: boolean;
	remote?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'List all accounts in the local keystore directory';

	return evmlc
		.command('accounts list')
		.alias('a l')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-r, --remote', 'list remote accounts')
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage: StagingFunction<
	Arguments,
	ASCIITable,
	BaseAccount[]
> = async (args: Arguments, session: Session) => {
	const staging = new Staging<Arguments, ASCIITable, BaseAccount[]>(
		session.debug,
		args
	);

	const status = await session.connect(args.options.host, args.options.port);

	const remote = args.options.remote || false;
	const formatted = args.options.formatted || false;

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	if (remote && !status) {
		staging.debug(
			'Cannot fetch remote accounts with an invalid connection'
		);

		return Promise.reject(
			new InvalidConnectionError(
				`A connection could be establised to ${host}:${port}.`
			)
		);
	}

	if (remote && status) {
		staging.debug('Fetching remote accounts');

		return Promise.resolve(
			staging.success(await session.node.getAccounts())
		);
	}

	let keystores: V3JSONKeyStore[];

	staging.debug(`Keystore path ${session.keystore.path}`);

	try {
		keystores = await session.keystore.list();
		staging.debug('Reading keystore successful');
	} catch (e) {
		return Promise.reject(e);
	}

	let accounts: BaseAccount[] = keystores.map(keystore => ({
		address: keystore.address,
		balance: 0,
		nonce: 0,
		bytecode: ''
	}));

	if (status) {
		staging.debug(`Fetching account details from ${host}:${port}`);

		try {
			const promises = keystores.map(
				async keystore =>
					await session.node.getAccount(keystore.address)
			);

			accounts = await Promise.all(promises);

			staging.debug(`Fetching account successful`);
		} catch (e) {
			return Promise.reject(e);
		}
	} else {
		staging.debug(`No valid connection detected`);
	}

	if (!formatted) {
		return Promise.resolve(staging.success(accounts));
	}

	const table = new ASCIITable().setHeading('Address', 'Balance', 'Nonce');

	for (const account of accounts) {
		table.addRow(
			account.address,
			account.balance.toString(10),
			account.nonce
		);
	}

	staging.debug(`Table creation successful`);

	return Promise.resolve(staging.success(table));
};
