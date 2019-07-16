import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import { BaseAccount } from 'evm-lite-core';
import { V3JSONKeyStore } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { EVM_LITE, INVALID_CONNECTION, KEYSTORE } from '../errors/generals';

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

export type Output = StagedOutput<Arguments, ASCIITable, BaseAccount[]>;

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

	const interactive = session.interactive;
	const remote = args.options.remote || false;
	const formatted = args.options.formatted || false;

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	if (remote && !status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}.`
			)
		);
	}

	if (remote && status) {
		staging.debug(`Successfully connected: ${host}:${port}`);

		let accounts: BaseAccount[];

		staging.debug(`Attempting to fetch remote accounts...`);

		try {
			accounts = await session.node.getAccounts();
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		return Promise.resolve(staging.success(accounts));
	}

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
