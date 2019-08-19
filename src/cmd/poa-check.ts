import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import utils from 'evm-lite-utils';

import Transaction from 'evm-lite-transaction';

import Frames, {
	execute,
	IOptions,
	IStagedOutput,
	IStagingFunction
} from '../frames';
import Session from '../Session';

import { TRANSACTION } from '../errors/generals';
import { POA_CHECK } from '../errors/poa';

interface Options extends IOptions {
	interactive?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
	address?: string;
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

export type Output = IStagedOutput<Arguments, boolean, boolean>;

export const stage: IStagingFunction<Arguments, boolean, boolean> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, boolean, boolean>(session, args);

	// prepare
	const { options } = args;
	const { success, error, debug } = frames.staging();
	const { connect } = frames.generics();
	const { contract: getContract } = frames.POA();
	const { call } = frames.transaction();

	// config
	const config = session.datadir.config;

	// command execution
	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	const interactive = options.interactive || session.interactive;

	await connect(
		host,
		port
	);

	const contract = await getContract();
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

		debug(`Nominee received: ${nominee}`);
	}

	if (!args.address) {
		return Promise.reject(
			error(POA_CHECK.ADDRESS_EMPTY, 'No nominee address provided.')
		);
	}

	args.address = utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			error(
				POA_CHECK.ADDRESS_INVALID_LENGTH,
				'Nominee address has an invalid length.'
			)
		);
	}

	debug(`Nominee address validated: ${args.address}`);

	let transaction: Transaction;

	debug(`Attempting to generate transaction...`);

	try {
		transaction = contract.methods.checkAuthorised(
			{
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			utils.cleanAddress(args.address)
		);
	} catch (e) {
		return Promise.reject(error(TRANSACTION.GENERATION, e.toString()));
	}

	const response = await call<boolean>(transaction);

	return Promise.resolve(success(response));
};
