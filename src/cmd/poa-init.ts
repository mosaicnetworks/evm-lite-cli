import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3JSONKeyStore, Keystore } from 'evm-lite-keystore';
import {
	Contract,
	Transaction,
	TransactionReceipt,
	Account
} from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../Staging';

import { Schema } from '../POA';

import { POA_INIT } from '../errors/poa';
import {
	INVALID_CONNECTION,
	EVM_LITE,
	TRANSACTION,
	KEYSTORE
} from '../errors/generals';

interface Options extends IOptions {
	interactive?: boolean;
	from?: string;
	pwd?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(monet: Vorpal, session: Session): Command {
	const description = 'Initialize PoA contract';

	return monet
		.command('poa init')
		.hidden()
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('--pwd <password>', 'passphase file path')
		.option('--from <address>', 'from address')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'f', 'from', 'host', 'pwd']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	from: string;
	passphrase: string;
}

export type Output = IStagedOutput<Arguments, string, string>;

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);
	const status = await session.connect(args.options.host, args.options.port);

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	const interactive = args.options.interactive || session.interactive;

	staging.debug(`Attempting to connect: ${host}:${port}`);

	let passphrase: string = '';

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could not be establised to ${host}:${port}`
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

	let keystores: V3JSONKeyStore[];

	staging.debug(`Keystore path: ${session.keystore.path}`);
	staging.debug(`Attempting to fetch accounts from keystore...`);

	try {
		keystores = await session.keystore.list();
	} catch (e) {
		return Promise.reject(staging.error(KEYSTORE.LIST, e.toString()));
	}

	if (!keystores.length) {
		return Promise.reject(
			staging.error(
				KEYSTORE.EMPTY,
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
		}
	];

	if (interactive && !args.address) {
		const { from, passphrase: p } = await inquirer.prompt<Answers>(
			questions
		);

		args.options.from = from;
		passphrase = p;

		staging.debug(`From received: ${from}`);
		staging.debug(`Passphrase received: ${p}`);
	}

	const from = Utils.trimHex(
		args.options.from || session.config.state.defaults.from
	);

	if (!from) {
		return Promise.reject(
			staging.error(POA_INIT.ADDRESS_EMPTY, 'No `from` address provided.')
		);
	}

	if (from.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_INIT.ADDRESS_INVALID_LENGTH,
				'`from` address has an invalid length.'
			)
		);
	}

	staging.debug(`'from' address validated: ${from}`);

	if (!passphrase) {
		staging.debug(`Passphrase path: ${args.options.pwd || 'null'}`);

		if (!args.options.pwd) {
			return Promise.reject(
				staging.error(
					POA_INIT.PWD_PATH_EMPTY,
					'Passphrase file path not provided.'
				)
			);
		}

		if (!Utils.exists(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_INIT.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_INIT.PWD_IS_DIR,
					'Passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Passphrase read successfully: ${passphrase}`);
	}

	let keystore: V3JSONKeyStore;

	staging.debug(`Attempting to fetch keystore for address...`);

	try {
		keystore = await session.keystore.get(from);
	} catch (e) {
		return Promise.reject(
			staging.error(
				KEYSTORE.FETCH,
				`Could not locate keystore for address ${from} in ${
					session.keystore.path
				}`
			)
		);
	}

	let decrypted: Account;

	staging.debug(`Attempting to decrypt keyfile with passphrase...`);

	try {
		decrypted = Keystore.decrypt(keystore, passphrase);
	} catch (err) {
		return Promise.reject(
			staging.error(
				KEYSTORE.DECRYPTION,
				'Cannot decrypt account with passphrase provided.'
			)
		);
	}

	const contract = Contract.load<Schema>(poa.abi, poa.address);

	let transaction: Transaction;

	staging.debug(`Attempting to generate transaction...`);

	try {
		transaction = contract.methods.init({
			from: args.options.from,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		});
	} catch (e) {
		return Promise.reject(
			staging.error(TRANSACTION.GENERATION, e.toString())
		);
	}

	let receipt: TransactionReceipt;

	staging.debug(`Attempting to send transaction...`);

	try {
		receipt = await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
	}

	staging.debug(JSON.stringify(receipt));

	return Promise.resolve(
		staging.success('Initialized PoA contract with initial whitelist.')
	);
};
