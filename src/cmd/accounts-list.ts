import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';
import { BaseAccount } from 'evm-lite-core';
import { MonikerBaseAccount } from 'evm-lite-keystore';

import Session from '../Session';
import Frames, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../frames';

import { EVM_LITE } from '../errors/generals';

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
	const frames = new Frames<Arguments, ASCIITable, BaseAccount[]>(
		session,
		args
	);

	// prepare
	const { options } = args;
	const { state } = session.config;

	const { success, error, debug } = frames.staging();
	const { list } = frames.keystore();

	/** Command Execution */
	debug(`Checking connection to node...`);

	const status = await session.connect(options.host, options.port);

	const interactive = session.interactive;
	const formatted = options.formatted || false;

	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

	const keystore = await list();
	let accounts: MonikerBaseAccount[] = Object.keys(keystore).map(moniker => ({
		moniker,
		address: keystore[moniker].address,
		balance: 0,
		nonce: 0,
		bytecode: ''
	}));

	if (!accounts.length) {
		return Promise.resolve(success([]));
	}

	if (status) {
		debug(`Successfully connected: ${host}:${port}`);
		debug(`Attempting to fetch accounts data...`);

		try {
			const promises = accounts.map(async acc => {
				const base = await session.node.getAccount(acc.address);
				return {
					...base,
					moniker: acc.moniker
				};
			});

			accounts = await Promise.all(promises);
		} catch (e) {
			return Promise.reject(error(EVM_LITE, e.text));
		}
	}

	if (!formatted && !interactive) {
		return Promise.resolve(success(accounts));
	}

	debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading(
		'Moniker',
		'Address',
		'Balance',
		'Nonce'
	);

	for (const account of accounts) {
		table.addRow(
			account.moniker,
			Utils.cleanAddress(account.address),
			account.balance.toString(10),
			account.nonce
		);
	}

	return Promise.resolve(success(table));
};
