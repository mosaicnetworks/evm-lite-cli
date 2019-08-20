import ASCIITable from 'ascii-table';

import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';
import utils from 'evm-lite-utils';

import Session from '../Session';
import Staging, { execute, IOptions, IStagingFunction } from '../staging';

interface Options extends IOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

interface WhitelistEntry {
	address: string;
	moniker: string;
}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'List whitelist entries for a connected node';

	return evmlc
		.command('poa whitelist')
		.alias('p wl')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['host', 'h']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, ASCIITable, WhitelistEntry[]>(args);

	// prepare
	const { options } = args;

	// config
	const config = session.datadir.config;

	// generate success, error, debug handlers
	const { debug, success, error } = staging.handlers(session.debug);

	// generate hooks
	const { connect } = staging.genericHooks(session);
	const { contract: getContract } = staging.poaHooks(session);
	const { call } = staging.txHooks(session);

	// command
	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	const interactive = session.interactive;
	const formatted = args.options.formatted || false;

	await connect(
		host,
		port
	);

	const contract = await getContract();

	debug(`Attempting to generate whitelist count transaction...`);

	const transaction = contract.methods.getWhiteListCount({
		gas: config.defaults.gas,
		gasPrice: config.defaults.gasPrice
	});

	const response: any = await call(transaction);
	const whitelistCount = response.toNumber();

	debug(`Whitelist Count: ${response}`);

	if (!whitelistCount) {
		return Promise.resolve(success([]));
	}

	const whitelist: WhitelistEntry[] = [];

	debug(`Attempting to fetch whitelist details...`);

	for (const i of Array.from(Array(whitelistCount).keys())) {
		const whitelistEntry: WhitelistEntry = {
			address: '',
			moniker: ''
		};

		const tx = contract.methods.getWhiteListAddressFromIdx(
			{
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			i
		);

		whitelistEntry.address = await call(tx);

		debug(`Received whitelist address: ${whitelistEntry.address}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			whitelistEntry.address
		);

		const hex = await call<string>(monikerTx);

		whitelistEntry.moniker = utils.hexToString(hex);

		debug(`Moniker received: ${whitelistEntry.moniker}`);

		whitelist.push(whitelistEntry);
	}

	if (!formatted && !interactive) {
		return Promise.resolve(success(whitelist));
	}

	debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading('Moniker', 'Address');

	for (const entry of whitelist) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address
		);
	}

	return Promise.resolve(success(table));
};
