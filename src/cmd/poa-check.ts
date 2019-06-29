import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import { V3JSONKeyStore } from 'evm-lite-keystore';
import { Utils, Contract } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { Schema } from '../POA';

import {
	InvalidConnection,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError
} from '../errors';

interface Options extends GenericOptions {
	interactive?: boolean;
	from?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}
export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Check whether a nominee was accepted';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'enter interactive')
		.option('-d, --debug', 'show debug output')
		.option('--from <address>', 'from address')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'from', 'h', 'host', 'nominee']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	from: string;
	nominee: string;
}

export const stage: StagingFunction<Arguments, boolean, boolean> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, boolean, boolean>(args);
	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	const interactive = args.options.interactive || session.interactive;

	const poa = await session.getPOAContract();

	if (!status) {
		return Promise.reject(
			new InvalidConnection(
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	staging.debug(
		`Successfully connected to ${session.node.host}:${session.node.port}`
	);

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
		},
		{
			message: 'Nominee address: ',
			name: 'nominee',
			type: 'input'
		}
	];

	if (interactive && !args.address) {
		const { nominee, from } = await inquirer.prompt<Answers>(questions);

		args.address = nominee;
		args.options.from = from;
	}

	if (!args.address) {
		return Promise.reject(new InvalidArgumentError('No address provided.'));
	}

	args.address = Utils.trimHex(args.address);

	staging.debug(`Address to nominate ${args.address}`);

	if (args.address.length !== 40 && args.address.length !== 42) {
		return Promise.reject(
			new InvalidArgumentError('Address has an invalid length.')
		);
	}

	if (!args.options.from && !session.config.state.defaults.from) {
		return Promise.reject(
			new InvalidArgumentError(
				'No from address provided or set in config.'
			)
		);
	}

	staging.debug(`From address ${args.options.from}`);

	const contract = Contract.load<Schema>(poa.abi, poa.address);
	const transaction = contract.methods.checkAuthorised(
		{
			from: args.options.from || session.config.state.defaults.from,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		},
		Utils.cleanAddress(args.address)
	);

	let response: boolean;

	try {
		response = await session.node.callTransaction<boolean>(transaction);
	} catch (e) {
		return Promise.reject(e);
	}

	return Promise.resolve(staging.success(response));
};
