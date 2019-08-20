import * as inquirer from 'inquirer';

import ASCIITable from 'ascii-table';
import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';
import utils from 'evm-lite-utils';

import { IBaseAccount } from 'evm-lite-client';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

import { ACCOUNTS_GET } from '../errors/accounts';
import { EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	formatted?: boolean;
	interactive?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
	address?: string;
}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'Fetches account details from a connected node';

	return evmlc
		.command('accounts get [address]')
		.alias('a g')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'h', 'host']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	address: string;
}

export type Output = IStagedOutput<Arguments, ASCIITable, IBaseAccount>;

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, ASCIITable, IBaseAccount>(args);

	// prepare
	const { options } = args;
	const { success, error, debug } = staging.handlers(session.debug);

	// hooks
	const { connect } = staging.genericHooks(session);

	// config
	const config = session.datadir.config;

	// command execution
	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	await connect(
		host,
		port
	);

	debug(`Successfully connected: ${host}:${port}`);

	const formatted = args.options.formatted || false;
	const interactive = args.options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
		{
			message: 'Address: ',
			name: 'address',
			type: 'input'
		}
	];

	if (interactive && !args.address) {
		const { address } = await inquirer.prompt<Answers>(questions);

		args.address = address;

		debug(`Address received: ${address}`);
	}

	if (!args.address) {
		return Promise.reject(
			error(ACCOUNTS_GET.ADDRESS_EMPTY, 'No address provided.')
		);
	}

	args.address = utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			error(
				ACCOUNTS_GET.ADDRESS_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	debug(`Address validated: ${args.address}`);

	let account: IBaseAccount;

	debug(`Attempting to fetch account details...`);

	try {
		account = await session.node.getAccount(args.address);
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.text));
	}

	if (!formatted && !interactive) {
		return Promise.resolve(success(account));
	}

	debug(`Preparing formatted output...`);

	const table: ASCIITable = new ASCIITable().setHeading(
		'Address',
		'Balance',
		'Nonce',
		'Bytecode'
	);

	table.addRow(
		account.address,
		account.balance.toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
		account.nonce,
		account.bytecode
	);

	return Promise.resolve(success(table));
};
