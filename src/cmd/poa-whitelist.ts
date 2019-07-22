import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { Contract } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, IStagingFunction, IOptions } from '../Staging';

import { Schema } from '../POA';
import { EVM_LITE, INVALID_CONNECTION } from '../errors/generals';

interface Options extends IOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

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
	const staging = new Staging<Arguments, ASCIITable, WhitelistEntry[]>(
		session.debug,
		args
	);

	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	const interactive = session.interactive;
	const formatted = args.options.formatted || false;

	staging.debug(`Attempting to connect: ${host}:${port}`);

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	let poa: { address: string; abi: any[] };

	staging.debug(`Attempting to fetch PoA data...`);

	try {
		poa = await session.getPOAContract();
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.toString()));
	}

	const contract = Contract.load<Schema>(poa.abi, poa.address);

	staging.debug(`Attempting to generate whitelist count transaction...`);

	const transaction = contract.methods.getWhiteListCount({
		gas: session.config.state.defaults.gas,
		gasPrice: session.config.state.defaults.gasPrice
	});

	let response: any;

	staging.debug(`Attempting to call whitelist count transaction...`);

	try {
		response = await session.node.callTransaction(transaction);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	const whitelistCount = response.toNumber();
	staging.debug(`Whitelist Count: ${response}`);

	const whitelist: WhitelistEntry[] = [];

	staging.debug(`Attempting to fetch whitelist details...`);

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

		try {
			whitelistEntry.address = await session.node.callTransaction(tx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(`Received whitelist address: ${whitelistEntry.address}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			whitelistEntry.address
		);

		let hex: string;

		try {
			hex = await session.node.callTransaction(monikerTx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		whitelistEntry.moniker = Utils.hexToString(hex);

		staging.debug(`Moniker received: ${whitelistEntry.moniker}`);

		whitelist.push(whitelistEntry);
	}

	if (!formatted && !interactive) {
		return Promise.resolve(staging.success(whitelist));
	}

	staging.debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading('Moniker', 'Address');

	for (const entry of whitelist) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address
		);
	}

	return Promise.resolve(staging.success(table));
};
