import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { Contract } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, IStagingFunction, IOptions } from '../Staging';

import { Schema } from '../POA';

import { INVALID_CONNECTION, EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
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
	const description = 'List nominees for a connected node';

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

export const stage: IStagingFunction<
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

	staging.debug(`Attempting to generate nominee count transaction...`);

	const transaction = contract.methods.getNomineeCount({
		gas: session.config.state.defaults.gas,
		gasPrice: session.config.state.defaults.gasPrice
	});

	let response: any;

	staging.debug(`Attempting to call nominee count transaction...`);

	try {
		response = await session.node.callTransaction(transaction);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	const nomineeCount = response.toNumber();
	staging.debug(`Nominee Count: ${response}`);

	if (!nomineeCount) {
		return Promise.resolve(staging.success([]));
	}

	const nominees: NomineeEntry[] = [];

	staging.debug(`Attempting to fetch nominee details...`);

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

		try {
			nominee.address = await session.node.callTransaction(tx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		staging.debug(`Received nominee address: ${nominee.address}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			nominee.address
		);

		let hex: string;

		try {
			hex = await session.node.callTransaction(monikerTx);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		nominee.moniker = Utils.hexToString(hex);

		staging.debug(`Moniker received: ${nominee.moniker}`);

		const votesTransaction = contract.methods.getCurrentNomineeVotes(
			{
				from: session.config.state.defaults.from,
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(nominee.address)
		);

		let votes: [string, string];

		try {
			votes = await session.node.callTransaction<[string, string]>(
				votesTransaction
			);
		} catch (e) {
			return Promise.reject(staging.error(EVM_LITE, e.text));
		}

		nominee.upVotes = parseInt(votes[0], 10);
		nominee.downVotes = parseInt(votes[1], 10);

		nominees.push(nominee);
	}

	if (!formatted && !interactive) {
		return Promise.resolve(staging.success(nominees));
	}

	staging.debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading(
		'Moniker',
		'Address',
		'Up Votes',
		'Down Votes'
	);

	for (const entry of nominees) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address,
			entry.upVotes,
			entry.downVotes
		);
	}

	return Promise.resolve(staging.success(table));
};
