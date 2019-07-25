import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { Contract } from 'evm-lite-core';

import Session from '../Session';
import Frames, { execute, IStagingFunction, IOptions } from '../frames';

import { EVM_LITE, INVALID_CONNECTION } from '../errors/generals';

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

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'List whitelist entries for a connected node';

	return evmlc
		.command('poa whitelist')
		.alias('p wl')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-f, --formatted', 'format output')
		.option('--from <address>', 'from address')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['from', 'host', 'h']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	from: string;
}

export const stage: IStagingFunction<
	Arguments,
	ASCIITable,
	WhitelistEntry[]
> = async (args: Arguments, session: Session) => {
	const frames = new Frames<Arguments, ASCIITable, WhitelistEntry[]>(
		session,
		args
	);

	// prepare
	const { options } = args;
	const { state } = session.config;

	// generate success, error, debug handlers
	const { debug, success, error } = frames.staging();

	// generate frames
	const { connect } = frames.generics();
	const { contract: getContract } = frames.POA();
	const { call } = frames.transaction();

	/** Command Execution */
	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

	const interactive = session.interactive;
	const formatted = args.options.formatted || false;

	await connect(
		host,
		port
	);

	const contract = await getContract();

	debug(`Attempting to generate whitelist count transaction...`);

	const transaction = contract.methods.getWhiteListCount({
		gas: session.config.state.defaults.gas,
		gasPrice: session.config.state.defaults.gasPrice
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
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			i
		);

		whitelistEntry.address = await call(tx);

		debug(`Received whitelist address: ${whitelistEntry.address}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			whitelistEntry.address
		);

		const hex = await call<string>(monikerTx);

		whitelistEntry.moniker = Utils.hexToString(hex);

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
