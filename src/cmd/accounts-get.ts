import * as inquirer from 'inquirer';

import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { BaseAccount } from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../Staging';

import { ACCOUNTS_GET } from '../errors/accounts';
import { INVALID_CONNECTION, EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	formatted?: boolean;
	interactive?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	address?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
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

export type Output = IStagedOutput<Arguments, ASCIITable, BaseAccount>;

export const stage: IStagingFunction<
	Arguments,
	ASCIITable,
	BaseAccount
> = async (args: Arguments, session: Session) => {
	const staging = new Staging<Arguments, ASCIITable, BaseAccount>(
		session.debug,
		args
	);

	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	staging.debug(`Attempting to connect: ${host}:${port}`);

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	staging.debug(`Successfully connected: ${host}:${port}`);

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

		staging.debug(`Address received: ${address}`);
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(ACCOUNTS_GET.ADDRESS_EMPTY, 'No address provided.')
		);
	}

	args.address = Utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_GET.ADDRESS_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	staging.debug(`Address validated: ${args.address}`);

	let account: BaseAccount;

	staging.debug(`Attempting to fetch account details...`);

	try {
		account = await session.node.getAccount(args.address);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	if (!formatted && !interactive) {
		return Promise.resolve(staging.success(account));
	}

	staging.debug(`Preparing formatted output...`);

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

	return Promise.resolve(staging.success(table));
};
