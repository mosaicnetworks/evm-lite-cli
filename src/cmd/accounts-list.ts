import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import { BaseAccount } from 'evm-lite-core';
import { V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../Staging';

import { EVM_LITE, KEYSTORE } from '../errors/generals';

interface Options extends IOptions {
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

export type Output = IStagedOutput<Arguments, ASCIITable, BaseAccount[]>;

export const stage: IStagingFunction<
	Arguments,
	ASCIITable,
	BaseAccount[]
> = async (args: Arguments, session: Session) => {
	const staging = new Staging<Arguments, ASCIITable, BaseAccount[]>(
		session.debug,
		args
	);

	staging.debug(`Checking connection to node...`);

	const status = await session.connect(args.options.host, args.options.port);

	const interactive = session.interactive;
	const formatted = args.options.formatted || false;

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	let keystores: V3JSONKeyStore[];

	staging.debug(`Attempting to fetch local accounts...`);

	try {
		keystores = await session.keystore.list();
	} catch (e) {
		return Promise.reject(staging.error(KEYSTORE.LIST, e.toString()));
	}

	let accounts: BaseAccount[] = keystores.map(keystore => ({
		address: keystore.address,
		balance: 0,
		nonce: 0,
		bytecode: ''
	}));

	if (!accounts.length) {
		return Promise.resolve(staging.success([]));
	}

	if (status) {
		staging.debug(`Successfully connected: ${host}:${port}`);
		staging.debug(`Attempting to fetch accounts data...`);

		try {
			const promises = keystores.map(
				async keystore =>
					await session.node.getAccount(keystore.address)
			);

			accounts = await Promise.all(promises);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}
	}

	if (!formatted && !interactive) {
		return Promise.resolve(staging.success(accounts));
	}

	staging.debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading('Address', 'Balance', 'Nonce');

	for (const account of accounts) {
		table.addRow(
			account.address,
			account.balance.toString(10),
			account.nonce
		);
	}

	return Promise.resolve(staging.success(table));
};
