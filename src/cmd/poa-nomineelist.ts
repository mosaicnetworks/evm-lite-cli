import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import { Utils, Contract } from 'evm-lite-core';

import Session from '../Session';
import Globals from '../Globals';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { Schema } from '../POA';

import { INVALID_CONNECTION, EVM_LITE } from '../errors/generals';

interface Options extends GenericOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

interface NomineeEntry {
	address: string;
	moniker: string;
	upVotes: number;
	downVotes: number;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'List nominees for the connected node';

	return evmlc
		.command('poa nomineelist')
		.alias('p nl')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-f, --formatted', 'format output')
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
	NomineeEntry[]
> = async (args: Arguments, session: Session) => {
	const staging = new Staging<Arguments, ASCIITable, NomineeEntry[]>(
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
	const transaction = contract.methods.getNomineeCount({
		gas: session.config.state.defaults.gas,
		gasPrice: session.config.state.defaults.gasPrice
	});

	let response: any;

	staging.debug(
		`Attempting to fetch nominee list count from ${host}:${port}`
	);

	try {
		response = await session.node.callTransaction(transaction);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	const nomineeCount = response.toNumber();
	const nominees: NomineeEntry[] = [];

	staging.debug(`Received nominee count of ${nomineeCount}`);

	for (const i of Array.from(Array(nomineeCount).keys())) {
		const nominee: NomineeEntry = {
			address: '',
			moniker: '',
			upVotes: 0,
			downVotes: 0
		};

		const tx = contract.methods.getNomineeAddressFromIdx(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			i
		);

		staging.debug(`Attempting to fetch nominee address for entry ${i}`);

		try {
			nominee.address = await session.node.callTransaction(tx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(
			`Successfull fetching nominee address for entry ${i} ${
				nominee.address
			}`
		);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			nominee.address
		);

		let hex: string;

		staging.debug(
			`Attempting to fetch moniker for nominee ${nominee.address}`
		);

		try {
			hex = await session.node.callTransaction(monikerTx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(
			`Successfull fetching moniker for nominee ${nominee.address}`
		);

		nominee.moniker = Globals.hexToString(hex)
			.trim()
			.replace(/\u0000/g, '');

		const votesTransaction = contract.methods.dev_getCurrentNomineeVotes(
			{
				from: session.config.state.defaults.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(nominee.address)
		);

		staging.debug(
			`Attempting to fetch votes for nominee ${nominee.address}`
		);

		let votes: [string, string];

		try {
			votes = await session.node.callTransaction<[string, string]>(
				votesTransaction
			);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}
		staging.debug(
			`Successfull fetching moniker for nominee ${nominee.address}`
		);

		nominee.upVotes = parseInt(votes[0], 10);
		nominee.downVotes = parseInt(votes[1], 10);

		nominees.push(nominee);
	}

	staging.debug(`Nominees array populated with length ${nominees.length}`);

	if (!formatted) {
		return Promise.resolve(staging.success(nominees));
	}

	const table = new ASCIITable().setHeading(
		'Moniker',
		'Address',
		'Up Votes',
		'Down Votes'
	);

	staging.debug(`Generating table for whitelist`);

	for (const entry of nominees) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address,
			entry.upVotes,
			entry.downVotes
		);
	}

	staging.debug(`Table generation successful`);

	return Promise.resolve(staging.success(table));
};
