import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import {
	V3JSONKeyStore,
	Utils as KeystoreUtils,
	Keystore
} from 'evm-lite-keystore';
import {
	Utils,
	Contract,
	Account,
	TransactionReceipt,
	EVMLC
} from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { Schema } from '../POA';
import {
	INVALID_CONNECTION,
	KEYSTORE,
	TRANSACTION,
	EVM_LITE
} from '../errors/generals';
import { POA_VOTE } from '../errors/poa';

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
		return Promise.reject(e);
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
			message: 'Verdict: ',
			name: 'verdict',
			type: 'confirm'
		}
	];

	if (interactive) {
		const { address, from, passphrase: p, verdict } = await inquirer.prompt<
			Answers
		>(questions);

		staging.debug(`Nominee address: ${address || 'null'}`);
		staging.debug(`From address: ${from || 'null'}`);
		staging.debug(`Verdict: ${verdict ? 'Yes' : 'No'}`);

		staging.debug(`Passphrase: ${p || 'null'}`);

		args.address = address;
		args.options.from = from;
		args.options.verdict = verdict;
		passphrase = p;
	}

	if (!args.address) {
		return Promise.reject(
			staging.error(
				POA_VOTE.ADDRESS_EMPTY,
				'No address provided to nominate.'
			)
		);
	}

	if (!args.options.verdict) {
		return Promise.reject(
			staging.error(
				POA_VOTE.VERDICT_EMPTY,
				'No verdict provided for nominee.'
			)
		);
	}

	args.address = Utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_VOTE.ADDRESS_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	staging.debug(`Nominee address validated: ${args.address}`);

	const from = args.options.from || session.config.state.defaults.from;

	if (!from) {
		return Promise.reject(
			staging.error(
				POA_VOTE.FROM_EMPTY,
				'No from address provided or set in config.'
			)
		);
	}

	if (from.length !== 40) {
		return Promise.reject(
			staging.error(
				POA_VOTE.FROM_INVALID_LENGTH,
				'Address has an invalid length.'
			)
		);
	}

	staging.debug(`From address validated: ${args.options.from}`);

	if (!passphrase) {
		staging.debug(`Passphrase path: ${args.options.pwd || 'null'}`);

		if (!args.options.pwd) {
			return Promise.reject(
				staging.error(
					POA_VOTE.PWD_PATH_EMPTY,
					'Passphrase file path not provided.'
				)
			);
		}

		if (!KeystoreUtils.exists(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_VOTE.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (KeystoreUtils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					POA_VOTE.PWD_IS_DIR,
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

	const transaction = contract.methods.castNomineeVote(
		{
			from,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		},
		Utils.cleanAddress(args.address),
		args.options.verdict
	);

	let receipt: TransactionReceipt;

	staging.debug(`Attempting to send transaction...`);

	try {
		receipt = await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.text));
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

	const nomineeVoteCastEvent = receipt.logs.filter(
		log => log.event === 'NomineeVoteCast'
	)[0];

	let nomineeDecisionLogs: any[] = [];
	let nomineeDecisionEvent;

	if (receipt.logs.length > 1) {
		nomineeDecisionLogs = receipt.logs.filter(
			log => log.event === 'NomineeVoteCast'
		);
	}

	if (nomineeDecisionLogs.length) {
		nomineeDecisionEvent = nomineeDecisionLogs[0];
	}

	const vote = nomineeVoteCastEvent.args._accepted ? 'Yes' : 'No';

	let message = `You (${
		nomineeVoteCastEvent.args._voter
	}) voted '${vote}' for '${nomineeVoteCastEvent.args._nominee}'. `;

	if (nomineeDecisionEvent) {
		const accepted = nomineeDecisionEvent.args._accepted
			? 'Accepted'
			: 'Rejected';

		message += `\nElection completed with the nominee being '${accepted}'.`;
	}

	return Promise.resolve(staging.success(message));
};
