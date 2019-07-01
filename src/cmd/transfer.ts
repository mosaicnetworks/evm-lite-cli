import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import {
	V3JSONKeyStore,
	Keystore,
	Utils as KeystoreUtils
} from 'evm-lite-keystore';
import { Utils, Account } from 'evm-lite-core';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import {
	InvalidConnectionError,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError,
	KeystoreNotFoundError,
	PathNotFoundError,
	InvalidPathError
} from '../errors';

interface Options extends GenericOptions {
	interactive?: boolean;
	host?: string;
	port?: number;
	pwd?: string;

	// tx
	from?: string;
	to?: string;
	gas?: number;
	gasprice?: number;
	value?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Initiate a transfer of token(s) to an address';

	return evmlc
		.command('transfer')
		.alias('t')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-d, --debug', 'show debug output')
		.option('-v, --value <value>', 'value to send')
		.option('-g, --gas <value>', 'gas')
		.option('-gp, --gasprice <value>', 'gas price')
		.option('-t, --to <address>', 'send to address')
		.option('-f, --from <address>', 'send from address')
		.option('--pwd <password>', 'passphrase file path')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['t', 'to', 'f', 'from', 'h', 'host', 'pwd']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface FirstAnswers {
	from: string;
}

interface SecondAnswers {
	passphrase: string;
}

interface ThirdAnswers {
	to: string;
	value: number;
	gas: number;
	gasPrice: number;
}

interface FourthAnswers {
	send: boolean;
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

	if (!status) {
		return Promise.reject(
			new InvalidConnectionError(
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	staging.debug(`Connected to node at ${host}:${port}`);

	const interactive = args.options.interactive || session.interactive;

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

	const first: inquirer.Questions<FirstAnswers> = [
		{
			choices: keystores.map(keystore => keystore.address),
			message: 'From: ',
			name: 'from',
			type: 'list'
		}
	];

	const second: inquirer.Questions<SecondAnswers> = [
		{
			message: 'Enter password: ',
			name: 'passphrase',
			type: 'password'
		}
	];

	const third: inquirer.Questions<ThirdAnswers> = [
		{
			message: 'To',
			name: 'to',
			type: 'input'
		},
		{
			default: 100,
			message: 'Value: ',
			name: 'value',
			type: 'number'
		},
		{
			default: session.config.state.defaults.gas || 100000,
			message: 'Gas: ',
			name: 'gas',
			type: 'number'
		},
		{
			default: session.config.state.defaults.gasPrice || 0,
			message: 'Gas Price: ',
			name: 'gasPrice',
			type: 'number'
		}
	];

	const fourth: inquirer.Questions<FourthAnswers> = [
		{
			message: 'Submit transaction',
			name: 'send',
			type: 'confirm'
		}
	];

	if (interactive) {
		const { from } = await inquirer.prompt<FirstAnswers>(first);

		args.options.from = Utils.cleanAddress(Utils.trimHex(from));
	}

	if (!args.options.from) {
		return Promise.reject(
			new InvalidArgumentError('Argument `from` not provided.')
		);
	}

	staging.debug(`Fetching keystore for address ${args.options.from}`);

	let keystore: V3JSONKeyStore;

	try {
		keystore = await session.keystore.get(args.options.from);

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

	if (interactive) {
		const { passphrase: p } = await inquirer.prompt<SecondAnswers>(second);

		passphrase = p.trim();
	}

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
					'Old passphrase file path provided does not exist.'
				)
			);
		}

		staging.debug(`Passphrase path exists`);

		if (KeystoreUtils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				new InvalidPathError(
					'Old passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Successfully read passphrase from file`);
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

	if (interactive) {
		const answers = await inquirer.prompt<ThirdAnswers>(third);

		args.options.to = answers.to;
		args.options.value = answers.value;
		args.options.gas = answers.gas;
		args.options.gasprice = answers.gasPrice;
	}

	args.options.gas = args.options.gas || session.config.state.defaults.gas;
	args.options.gasprice =
		args.options.gasprice || session.config.state.defaults.gasPrice;

	if (!args.options.to || !args.options.value) {
		return Promise.reject(
			new InvalidArgumentError(
				'Provide an address to send to and a value.'
			)
		);
	}

	let send: boolean = true;

	const transaction = Account.prepareTransfer(
		args.options.from,
		args.options.to,
		args.options.value,
		args.options.gas,
		args.options.gasprice
	);

	staging.debug(`Generated transaction`);

	console.log(transaction);

	if (interactive) {
		const { send: s } = await inquirer.prompt<FourthAnswers>(fourth);

		send = s;
	}

	if (!send) {
		return Promise.resolve(staging.success('Transaction aborted.'));
	}

	staging.debug(`Attempting to send transaction`);

	try {
		await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(e.text);
	}

	staging.debug(`Sucessfully submitted transaction to node`);

	return Promise.resolve(
		staging.success('Transaction submitted successfully.')
	);
};
