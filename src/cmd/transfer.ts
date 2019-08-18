import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import utils from 'evm-lite-utils';

import Account from 'evm-lite-account';
import { IMonikerBaseAccount } from 'evm-lite-keystore';

import Frames, {
	execute,
	IOptions,
	IStagedOutput,
	IStagingFunction
} from '../frames';
import Session from '../Session';

import { TRANSFER } from '../errors/accounts';

interface Options extends IOptions {
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
		.option('-f, --from <moniker>', 'moniker of sender')
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

export type Output = IStagedOutput<Arguments, string, string>;

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { options } = args;
	const state = session.datadir.config;

	const { success, error, debug } = frames.staging();
	const { connect } = frames.generics();
	const { send } = frames.transaction();
	const { list, get, decrypt } = frames.keystore();

	/** Command Execution */
	let passphrase: string = '';

	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

	const interactive = options.interactive || session.interactive;

	await connect(
		host,
		port
	);

	const keystore = await list();
	const accounts: IMonikerBaseAccount[] = await Promise.all(
		Object.keys(keystore).map(async moniker => {
			const base = await session.node.getAccount(
				keystore[moniker].address
			);

			return {
				...base,
				moniker
			};
		})
	);

	const parseBalance = (s: string | any) => {
		if (typeof s === 'object') {
			return s.toFormat(0);
		} else {
			return s;
		}
	};
	const first: inquirer.Questions<FirstAnswers> = [
		{
			choices: accounts.map(
				acc => `${acc.moniker} (${parseBalance(acc.balance)})`
			),
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
			default: state.defaults.gas || 100000,
			message: 'Gas: ',
			name: 'gas',
			type: 'number'
		},
		{
			default: state.defaults.gasPrice || 0,
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

		options.from = utils.trimHex(from.split(' ')[0]);

		debug(`From address received: ${from}`);
	}

	const from = options.from || state.defaults.from;

	if (!from) {
		return Promise.reject(
			error(
				TRANSFER.FROM_EMPTY,
				'No `from` moniker provided or set in config.'
			)
		);
	}

	const keyfile = await get(from);

	if (interactive) {
		const { passphrase: p } = await inquirer.prompt<SecondAnswers>(second);

		passphrase = p.trim();

		debug(`Passphrase received: ${p}`);
	}

	if (!passphrase) {
		debug(`Passphrase path: ${options.pwd || 'null'}`);

		if (!options.pwd) {
			return Promise.reject(
				error(TRANSFER.PWD_PATH_EMPTY, '--pwd file path not provided.')
			);
		}

		if (!utils.exists(options.pwd)) {
			return Promise.reject(
				error(
					TRANSFER.PWD_PATH_NOT_FOUND,
					'--pwd file path provided does not exist.'
				)
			);
		}

		if (utils.isDirectory(options.pwd)) {
			return Promise.reject(
				error(
					TRANSFER.PWD_IS_DIR,
					'--pwd file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(options.pwd, 'utf8').trim();

		debug(`Passphrase read successfully: ${passphrase}`);
	}

	const decrypted = await decrypt(keyfile, passphrase);

	if (interactive) {
		const answers = await inquirer.prompt<ThirdAnswers>(third);

		options.to = answers.to;
		options.value = answers.value;
		options.gas = answers.gas;
		options.gasprice = answers.gasPrice;

		debug(`To received: ${answers.to || 'null'}`);
		debug(`Value received: ${answers.value || 'null'}`);
		debug(`Gas received: ${answers.gas || 'null'}`);
		debug(`Gas Price received: ${answers.gasPrice ? answers.gasPrice : 0}`);
	}

	options.gas = options.gas || state.defaults.gas;
	options.gasprice = options.gasprice || state.defaults.gasPrice;

	if (!options.to || !options.value) {
		return Promise.reject(
			error(
				TRANSFER.TO_VALUE_EMPTY,
				'Provide `to` address and `value` to send'
			)
		);
	}

	if (utils.trimHex(options.to).length !== 40) {
		return Promise.reject(
			error(TRANSFER.ADDRESS_INVALID_LENGTH, 'Invalid `to` address')
		);
	}

	let confirm: boolean = true;

	debug(`Attempting to generate transaction...`);

	const transaction = Account.prepareTransfer(
		keyfile.address,
		options.to,
		options.value,
		options.gas,
		options.gasprice
	);

	let tx = {
		from: transaction.from,
		to: transaction.to,
		value: transaction.value,
		gas: transaction.gas,
		gasPrice: transaction.gasPrice ? transaction.gasPrice : 0
	};

	if (interactive) {
		console.log(JSON.stringify(tx, null, 2));
	}

	if (interactive) {
		const { send: s } = await inquirer.prompt<FourthAnswers>(fourth);

		confirm = s;
	}

	if (!confirm) {
		return Promise.resolve(success('Transaction aborted.'));
	}

	await send(transaction, decrypted);

	return Promise.resolve(success('Transaction submitted successfully.'));
};
