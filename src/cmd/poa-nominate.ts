import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3JSONKeyStore, Keystore } from 'evm-lite-keystore';
import { Contract, Account, TransactionReceipt } from 'evm-lite-core';

import Session from '../Session';
import Globals from '../Globals';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { Schema } from '../POA';

import { POA_NOMINATE } from '../errors/poa';
import {
	EVM_LITE,
	TRANSACTION,
	INVALID_CONNECTION,
	KEYSTORE
} from '../errors/generals';

interface Options extends GenericOptions {
	interactive?: boolean;
	from?: string;
	pwd?: string;
	moniker?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	address?: string;
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Nominate an address to proceed to election';

	return evmlc
		.command('poa nominate [address]')
		.alias('p n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('-d, --debug', 'show debug output')
		.option('--pwd <password>', 'passphase file path')
		.option('--moniker <moniker>', 'moniker of the nominee')
		.option('--from <address>', 'from address')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['_', 'pwd', 'moniker', 'from', 'h', 'host']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	from: string;
	address: string;
	passphrase: string;
	moniker: string;
}

export type Output = StagedOutput<Arguments, string, string>;

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
		},
		{
			message: 'Nominee: ',
			name: 'address',
			type: 'input'
		},
		{
			message: 'Moniker: ',
			name: 'moniker',
			type: 'input'
		}
	];

	if (interactive) {
		const { address, from, passphrase: p, moniker } = await inquirer.prompt<
			Answers
		>(questions);

		staging.debug(`Moniker: ${moniker || 'null'}`);
		staging.debug(`Nominee address: ${address || 'null'}`);
		staging.debug(`From address: ${from || 'null'}`);
		staging.debug(`Passphrase: ${p || 'null'}`);

		args.address = Utils.trimHex(address);
		args.options.from = from;
		args.options.moniker = moniker;

		passphrase = p;
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(
				POA_NOMINATE.ADDRESS_EMPTY,
				'No address provided to nominate.'
			)
		);
	}

	if (!args.options.moniker) {
		return Promise.reject(
			staging.error(
				POA_NOMINATE.MONIKER_EMPTY,
				'No moniker provided for nominee.'
			)
		);
	}

	args.address = Utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_NOMINATE.ADDRESS_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	staging.debug(`Nominee address validated: ${args.address}`);

	const from = Utils.trimHex(
		args.options.from || session.config.state.defaults.from
	);

	if (!from) {
		return Promise.reject(
			staging.error(
				POA_NOMINATE.FROM_EMPTY,
				'No from address provided or set in config.'
			)
		);
	}

	if (from.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_NOMINATE.FROM_INVALID_LENGTH,
				'`from` address has an invalid length.'
			)
		);
	}

	staging.debug(`From address validated: ${args.options.from}`);

	if (!passphrase) {
		staging.debug(`Passphrase path: ${args.options.pwd || 'null'}`);

		if (!args.options.pwd) {
			return Promise.reject(
				staging.error(
					POA_NOMINATE.PWD_PATH_EMPTY,
					'Passphrase file path not provided.'
				)
			);
		}

		if (!Utils.exists(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_NOMINATE.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_NOMINATE.PWD_IS_DIR,
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
				`Could not locate keystore for address ${args.address} in ${
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

	staging.debug(`Attempting to generate transaction...`);

	// could be going wrong here.
	const transaction = contract.methods.submitNominee(
		{
			from,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		},
		Utils.cleanAddress(args.address),
		args.options.moniker
	);

	let receipt: TransactionReceipt;

	staging.debug(`Attempting to send transaction...`);

	try {
		receipt = await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(e.text || e.toString());
	}

	if (!receipt.logs.length) {
		return Promise.reject(
			staging.error(
				TRANSACTION.EMPTY_LOGS,
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or you might not be whitelisted.'
			)
		);
	}

	staging.debug(`Received transaction logs and parsing...`);

	const nomineeProposedEvent = receipt.logs.filter(
		log => log.event === 'NomineeProposed'
	)[0];
	const monikerAnnouceEvent = receipt.logs.filter(
		log => log.event === 'MonikerAnnounce'
	)[0];

	const returnData = `You (${
		nomineeProposedEvent.args._proposer
	}) nominated '${Globals.hexToString(monikerAnnouceEvent.args._moniker)}' (${
		nomineeProposedEvent.args._nominee
	})`;

	return Promise.resolve(staging.success(returnData));
};
