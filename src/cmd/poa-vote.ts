import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import {
	V3JSONKeyStore,
	Utils as KeystoreUtils,
	Keystore
} from 'evm-lite-keystore';
import { Utils, Contract, Account, TransactionReceipt } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { Schema } from '../POA';

import {
	InvalidConnectionError,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError,
	InvalidPathError,
	PathNotFoundError,
	KeystoreNotFoundError,
	EmptyTransactionReceiptLogsError
} from '../errors';

interface Options extends GenericOptions {
	interactive?: boolean;
	verdict?: boolean;
	from?: string;
	pwd?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	address?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Vote for an nominee currently in election';

	return evmlc
		.command('poa vote [address]')
		.alias('p v')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('-d, --debug', 'show debug output')
		.option('--verdict <boolean>', 'verdict for given address')
		.option('--pwd <password>', 'passphrase file path')
		.option('--from <address>', 'from address')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'from', 'pwd', 'host', 'h']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	from: string;
	address: string;
	passphrase: string;
	verdict: boolean;
}

export const stage: StagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);

	let passphrase: string = '';

	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	const interactive = args.options.interactive || session.interactive;

	const poa = await session.getPOAContract();

	if (!status) {
		return Promise.reject(
			new InvalidConnectionError(
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
			message: 'From: ',
			name: 'from',
			type: 'list'
		},
		{
			message: 'Passphrase: ',
			name: 'passphrase',
			type: 'password'
		},
		{
			message: 'Nominee: ',
			name: 'address',
			type: 'input'
		},
		{
			message: 'Verdict: ',
			name: 'verdict',
			type: 'confirm'
		}
	];

	if (interactive) {
		const { address, from, passphrase: p, verdict } = await inquirer.prompt<
			Answers
		>(questions);

		args.address = address;
		args.options.from = from;
		args.options.verdict = verdict;
		passphrase = p;
	}

	if (!args.address) {
		return Promise.reject(
			new InvalidArgumentError('No address provided to nominate.')
		);
	}

	if (!args.options.verdict) {
		return Promise.reject(
			new InvalidArgumentError('No verdict provided for nominee.')
		);
	}

	args.address = Utils.trimHex(args.address);

	staging.debug(`Address to nominate ${args.address}`);

	if (args.address.length !== 40 && args.address.length !== 42) {
		return Promise.reject(
			new InvalidArgumentError('Address has an invalid length.')
		);
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

	if (!passphrase) {
		if (!args.options.pwd) {
			return Promise.reject(
				new InvalidArgumentError('Passphrase file path not provided.')
			);
		}

		staging.debug(`Passphrase path detected`);

		if (!KeystoreUtils.exists(args.options.pwd)) {
			return Promise.reject(
				new PathNotFoundError(
					'Passphrase file path provided does not exist.'
				)
			);
		}

		staging.debug(`Passphrase path exists`);

		if (KeystoreUtils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				new InvalidPathError(
					'Passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Successfully read passphrase from file`);
	}

	staging.debug(`Fetching keystore for address ${args.options.from}`);

	let keystore: V3JSONKeyStore;

	try {
		keystore = await session.keystore.get(from);

		staging.debug(`Found keystore for account ${args.options.from}`);
	} catch (e) {
		return Promise.reject(
			new KeystoreNotFoundError(
				`Could not locate keystore for address ${args.address} in ${
					session.keystore.path
				}`
			)
		);
	}

	let decrypted: Account;

	staging.debug(`Attempting to decrypt keystore with passphrase`);

	try {
		decrypted = Keystore.decrypt(keystore, passphrase);
	} catch (err) {
		return Promise.reject(
			new InvalidArgumentError(
				'Cannot decrypt account with passphrase provided.'
			)
		);
	}

	staging.debug(`Successfully decrypted keystore`);

	const contract = Contract.load<Schema>(poa.abi, poa.address);
	const transaction = contract.methods.castNomineeVote(
		{
			from,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		},
		Utils.cleanAddress(args.address),
		args.options.verdict
	);

	staging.debug(`Contract address ${poa.address}`);
	staging.debug(`Genrated vote transaction`);

	let receipt: TransactionReceipt;

	staging.debug(`Attempting to send transaction to node ${host}:${port}`);

	try {
		receipt = await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(e);
	}

	if (!receipt.logs.length) {
		return Promise.reject(
			new EmptyTransactionReceiptLogsError(
				'No logs were returned. Possible due to lack of `gas` or you are not whitelisted.'
			)
		);
	}

	staging.debug(`Logs received from transaction. Parsing...`);

	let nomineeDecisionEvent: any;

	const nomineeVoteCastEvent = receipt.logs[0];

	if (receipt.logs.length > 1) {
		nomineeDecisionEvent = receipt.logs[1];
	}

	const vote = nomineeVoteCastEvent.args._accepted ? 'Yes' : 'No';

	let message = `You (${
		nomineeVoteCastEvent.args._voter
	}) voted '${vote}' for '${nomineeVoteCastEvent.args._nominee}'. `;

	if (nomineeDecisionEvent) {
		const accepted = nomineeDecisionEvent.args._accepted
			? 'Accepted'
			: 'Rejected';

		message += `Election completed with the nominee being '${accepted}'.`;
	}

	return Promise.resolve(staging.success(message));
};
