import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import { V3JSONKeyStore, Keystore } from 'evm-lite-keystore';
import { Account } from 'evm-lite-core';

import Session from '../Session';
import Staging, {
	execute,
	StagingFunction,
	GenericOptions,
	StagedOutput
} from '../Staging';

import { TRANSFER } from '../errors/accounts';
import { INVALID_CONNECTION, KEYSTORE } from '../errors/generals';

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

	staging.debug(`Attempting to connect: ${host}:${port}`);

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	const interactive = args.options.interactive || session.interactive;

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

		args.options.from = Utils.trimHex(from);

		staging.debug(`From address received: ${from}`);
	}

	if (!args.options.from) {
		return Promise.reject(
			staging.error(TRANSFER.FROM_EMPTY, 'Argument `from` not provided.')
		);
	}

	staging.debug(`From address validated: ${args.options.from}`);
	staging.debug(`Attempting to fetch keystore for address...`);

	let keystore: V3JSONKeyStore;

	try {
		keystore = await session.keystore.get(args.options.from);
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

	if (interactive) {
		const { passphrase: p } = await inquirer.prompt<SecondAnswers>(second);

		passphrase = p.trim();

		staging.debug(`Passphrase received: ${p}`);
	}

	if (!passphrase) {
		staging.debug(`Passphrase path: ${args.options.pwd || 'null'}`);

		if (!args.options.pwd) {
			return Promise.reject(
				staging.error(
					TRANSFER.PWD_PATH_EMPTY,
					'--pwd file path not provided.'
				)
			);
		}

		if (!Utils.exists(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					TRANSFER.PWD_PATH_NOT_FOUND,
					'--pwd file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(args.options.pwd)) {
			return Promise.reject(
				staging.error(
					TRANSFER.PWD_IS_DIR,
					'--pwd file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(args.options.pwd, 'utf8').trim();

		staging.debug(`Passphrase read successfully: ${passphrase}`);
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

	if (interactive) {
		const answers = await inquirer.prompt<ThirdAnswers>(third);

		args.options.to = answers.to;
		args.options.value = answers.value;
		args.options.gas = answers.gas;
		args.options.gasprice = answers.gasPrice;

		staging.debug(`To received: ${answers.to || 'null'}`);
		staging.debug(`Value received: ${answers.value || 'null'}`);
		staging.debug(`Gas received: ${answers.gas || 'null'}`);
		staging.debug(`Gas Price received: ${answers.gasPrice || 'null'}`);
	}

	args.options.gas = args.options.gas || session.config.state.defaults.gas;
	args.options.gasprice =
		args.options.gasprice || session.config.state.defaults.gasPrice;

	if (!args.options.to || !args.options.value) {
		return Promise.reject(
			staging.error(
				TRANSFER.TO_VALUE_EMPTY,
				'Provide `to` address and `value` to send'
			)
		);
	}

	let send: boolean = true;

	staging.debug(`Attempting to generate transaction...`);

	const transaction = Account.prepareTransfer(
		args.options.from,
		args.options.to,
		args.options.value,
		args.options.gas,
		args.options.gasprice
	);

	let tx = {
		from: transaction.from,
		to: transaction.to,
		value: transaction.value,
		gas: transaction.gas,
		gasPrice: transaction.gasPrice
	};

	console.log(tx);

	if (interactive) {
		const { send: s } = await inquirer.prompt<FourthAnswers>(fourth);

		send = s;
	}

	if (!send) {
		return Promise.resolve(staging.success('Transaction aborted.'));
	}

	staging.debug(`Attempting to send transaction...`);

	try {
		await session.node.sendTransaction(transaction, decrypted);
	} catch (e) {
		return Promise.reject(e.text);
	}

	return Promise.resolve(
		staging.success('Transaction submitted successfully.')
	);
};
