import ASCIITable from 'ascii-table';
import Vorpal, { Args, Command } from 'vorpal';

import utils, { toUnitToken } from 'evm-lite-utils';

import { Solo } from 'evm-lite-consensus';
import { IMonikerBaseAccount } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

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

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
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
};

export type Output = IStagedOutput<
	Arguments,
	ASCIITable,
	IMonikerBaseAccount[]
>;

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, ASCIITable, IMonikerBaseAccount[]>(
		args
	);

	// config
	const config = session.datadir.config;

	// prepare
	const { options } = args;

	// handlers
	const { success, error, debug } = staging.handlers(session.debug);

	// hooks
	const { list } = staging.keystoreHooks(session);

	// command execution
	debug(`Checking connection to node...`);

	const status = await session.connect(options.host, options.port);

	const interactive = session.interactive;
	const formatted = options.formatted || false;

	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	const keystore = await list();
	let accounts: IMonikerBaseAccount[] = Object.keys(keystore).map(
		moniker => ({
			moniker,
			address: keystore[moniker].address,
			balance: 0,
			nonce: 0,
			bytecode: ''
		})
	);

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
		'Balance (T)',
		'Nonce'
	);

	for (const account of accounts) {
		const val = toUnitToken(account.balance.toString(10) + 'a');

		table.addRow(
			account.moniker,
			utils.cleanAddress(account.address),
			val,
			account.nonce
		);
	}

	return Promise.resolve(success(table));
};
