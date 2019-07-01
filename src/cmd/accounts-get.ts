import * as inquirer from 'inquirer';

import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import { BaseAccount, Utils } from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { ACCOUNTS_GET } from '../errors/accounts';
import { INVALID_CONNECTION, EVM_LITE_ERROR } from '../errors/generals';

interface Options extends GenericOptions {
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

export type Output = StagedOutput<Arguments, ASCIITable, BaseAccount>;

export const stage: StagingFunction<
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

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	staging.debug(
		`Successfully connected to ${session.node.host}:${session.node.port}`
	);

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
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(ACCOUNTS_GET.ADDRESS_EMPTY, 'No address provided.')
		);
	}

	args.address = Utils.trimHex(args.address);

	staging.debug(`Address to fetch ${args.address}`);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				ACCOUNTS_GET.ADDRESS_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	let account: BaseAccount;

	staging.debug(`Attempting to fetch account from ${host}:${port}`);

	try {
		account = await session.node.getAccount(args.address);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE_ERROR, e.text));
	}

	staging.debug(`Successfully fetched account ${account.address}`);

	if (!formatted) {
		return Promise.resolve(staging.success(account));
	}

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

	staging.debug(`Created table for account`);

	return Promise.resolve(staging.success(table));
};
