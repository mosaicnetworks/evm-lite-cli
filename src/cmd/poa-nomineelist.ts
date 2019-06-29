import * as inquirer from 'inquirer';

import ASCIITable from 'ascii-table';

import Vorpal, { Command, Args } from 'vorpal';

import { V3JSONKeyStore } from 'evm-lite-keystore';
import { Utils, Contract } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { Schema } from '../POA';

import {
	InvalidConnectionError,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError
} from '../errors';
import Globals from '../Globals';

interface Options extends GenericOptions {
	interactive?: boolean;
	formatted?: boolean;
	from?: string;
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
		.option('-i, --interactive', 'interactive')
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
	const interactive = args.options.interactive || session.interactive;

	const poa = await session.getPOAContract();

	if (!status) {
		return Promise.reject(
			new InvalidConnectionError(
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	let keystores: V3JSONKeyStore[];

	staging.debug(
		`Attempting to read keystore directory at ${session.keystore.path}`
	);

	try {
		keystores = await session.keystore.list();

		staging.debug('Reading keystore successful.');
	} catch (e) {
		return Promise.reject(e);
	}

	staging.debug(`Keystores length ${keystores.length}`);

	if (!keystores.length) {
		return Promise.reject(
			new EmptyKeystoreDirectoryError(
				`No accounts found in keystore directory ${
					session.keystore.path
				}`
			)
		);
	}

	const questions: inquirer.Questions<Answers> = [
		{
			choices: keystores.map(keystore => keystore.address),
			default: Utils.trimHex(session.config.state.defaults.from),
			message: 'From: ',
			name: 'from',
			type: 'list'
		}
	];

	if (interactive) {
		const { from } = await inquirer.prompt(questions);

		args.options.from = from;
	}

	const from = args.options.from || session.config.state.defaults.from;

	if (!from) {
		return Promise.reject(
			new InvalidArgumentError(
				'No from address provided or set in config.'
			)
		);
	}

	staging.debug(`From address ${from}`);
	staging.debug(`Contract address ${poa.address}`);

	const contract = Contract.load<Schema>(poa.abi, poa.address);
	const transaction = contract.methods.getNomineeCount({
		from,
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
		return Promise.reject(e);
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
				from: Utils.cleanAddress(
					args.options.from || session.config.state.defaults.from
				),
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			i
		);

		staging.debug(`Attempting to fetch nominee address for entry ${i}`);

		try {
			nominee.address = await session.node.callTransaction(tx);
		} catch (e) {
			return Promise.reject(e);
		}

		staging.debug(
			`Successfull fetching nominee address for entry ${i} ${
				nominee.address
			}`
		);

		const monikerTx = contract.methods.getMoniker(
			{
				from: Utils.cleanAddress(
					args.options.from || session.config.state.defaults.from
				),
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
			return Promise.reject(e);
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
			return Promise.reject(e);
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
