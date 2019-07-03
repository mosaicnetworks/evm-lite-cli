import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import { Utils, Contract, Transaction } from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { Schema } from '../POA';

import { POA_CHECK } from '../errors/poa';
import { INVALID_CONNECTION, EVM_LITE, TRANSACTION } from '../errors/generals';

interface Options extends GenericOptions {
	interactive?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	address?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Check whether an address is on the whitelist';

	return evmlc
		.command('poa check [address]')
		.alias('p c')
		.description(description)
		.option('-i, --interactive', 'enter interactive')
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'from', 'h', 'host']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	nominee: string;
}

export type Output = StagedOutput<Arguments, boolean, boolean>;

export const stage: StagingFunction<Arguments, boolean, boolean> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, boolean, boolean>(
		session.debug,
		args
	);
	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	const interactive = args.options.interactive || session.interactive;

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
		staging.debug('POA contract info fetch error');

		return Promise.reject(staging.error(EVM_LITE, e.toString()));
	}

	const questions: inquirer.Questions<Answers> = [
		{
			message: 'Nominee address: ',
			name: 'nominee',
			type: 'input'
		}
	];

	if (interactive && !args.address) {
		const { nominee } = await inquirer.prompt<Answers>(questions);

		args.address = nominee;

		staging.debug(`Nominee received: ${nominee}`);
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(
				POA_CHECK.ADDRESS_EMPTY,
				'No nominee address provided.'
			)
		);
	}

	args.address = Utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_CHECK.ADDRESS_INVALID_LENGTH,
				'Nominee address has an invalid length.'
			)
		);
	}

	staging.debug(`Nominee address validated: ${args.address}`);

	const contract = Contract.load<Schema>(poa.abi, poa.address);

	let transaction: Transaction;

	staging.debug(`Attempting to generate transaction...`);

	try {
		transaction = contract.methods.checkAuthorised(
			{
				gas: session.config.state.defaults.gas,
				gasPrice: session.config.state.defaults.gasPrice
			},
			Utils.cleanAddress(args.address)
		);
	} catch (e) {
		return Promise.reject(
			staging.error(TRANSACTION.GENERATION, e.toString())
		);
	}

	let response: boolean;

	staging.debug(`Attempting to call transaction...`);

	try {
		response = await session.node.callTransaction<boolean>(transaction);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	return Promise.resolve(staging.success(response));
};
