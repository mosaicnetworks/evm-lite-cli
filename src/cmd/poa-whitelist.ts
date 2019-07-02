import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import { Contract } from 'evm-lite-core';

import Session from '../Session';
import Globals from '../Globals';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { Schema } from '../POA';
import { EVM_LITE, INVALID_CONNECTION } from '../errors/generals';

interface Options extends GenericOptions {
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

export const stage: StagingFunction<
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

	const formatted = args.options.formatted || false;

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	let poa: { address: string; abi: any[] };

	try {
		poa = await session.getPOAContract();
	} catch (e) {
		staging.debug('POA contract info fetch error');

		return Promise.reject(staging.error(EVM_LITE, e.toString()));
	}

	staging.debug('POA contract info fetch successful');
	staging.debug(`Contract address ${poa.address}`);

	const contract = Contract.load<Schema>(poa.abi, poa.address);
	const transaction = contract.methods.getWhiteListCount({
		gas: session.config.state.defaults.gas,
		gasPrice: session.config.state.defaults.gasPrice
	});

	let response: any;

	staging.debug(`Attempting to fetch whitelist count from ${host}:${port}`);

	try {
		response = await session.node.callTransaction(transaction);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	const whitelistCount = response.toNumber();
	const whitelist: WhitelistEntry[] = [];

	staging.debug(`Received whitelist count of ${whitelistCount}`);

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

		staging.debug(`Attempting to fetch whitelist address for entry ${i}`);

		try {
			whitelistEntry.address = await session.node.callTransaction(tx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(`Successfull fetching whitelist address for entry ${i}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			whitelistEntry.address
		);

		let hex: string;

		staging.debug(`Attempting to fetch whitelist moniker for entry ${i}`);

		try {
			hex = await session.node.callTransaction(monikerTx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(`Successfull fetching whitelist moniker for entry ${i}`);

		whitelistEntry.moniker = Globals.hexToString(hex)
			.trim()
			.replace(/\u0000/g, '');

		whitelist.push(whitelistEntry);
	}

	staging.debug(`Whitelist array populated with length ${whitelist.length}`);

	if (!formatted) {
		return Promise.resolve(staging.success(whitelist));
	}

	const table = new ASCIITable().setHeading('Moniker', 'Address');

	staging.debug(`Generating table for whitelist`);

	for (const entry of whitelist) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address
		);
	}

	staging.debug(`Table generation successful`);

	return Promise.resolve(staging.success(table));
};
