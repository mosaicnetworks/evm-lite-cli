import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import utils from 'evm-lite-utils';

import { Solo } from 'evm-lite-consensus';
import { IMonikerBaseAccount } from 'evm-lite-keystore';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

import { TRANSFER } from '../errors/accounts';
import { EVM_LITE } from '../errors/generals';

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

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
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
};

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

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	// prepare
	const { options } = args;

	// config
	const config = session.datadir.config;

	// handlers
	const { success, error, debug } = staging.handlers(session.debug);

	// hooks
	const { connect } = staging.genericHooks(session);
	const { send } = staging.txHooks(session);
	const { list, get, decrypt } = staging.keystoreHooks(session);

	// command execution
	let passphrase: string = '';

	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

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
			default: config.defaults.gas || 100000,
			message: 'Gas: ',
			name: 'gas',
			type: 'number'
		},
		{
			default: config.defaults.gasPrice || 0,
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
		const { from: f } = await inquirer.prompt<FirstAnswers>(first);

		options.from = utils.trimHex(f.split(' ')[0]);

		debug(`From address received: ${f}`);
	}

	const from = options.from || config.defaults.from;

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

	options.gas = options.gas || config.defaults.gas;
	options.gasprice = options.gasprice || config.defaults.gasPrice;

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

	const tx = {
		from: keyfile.address,
		to: options.to,
		value: options.value,
		gas: options.gas,
		gasPrice: options.gasprice ? options.gasprice : 0
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

	debug('Attemping to send tranfer transaction...');
	try {
		const r = await session.node.transfer(
			decrypted,
			options.to,
			options.value,
			options.gas,
			options.gasprice
		);

		debug(JSON.stringify(r));
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.text || e.toString()));
	}

	return Promise.resolve(success('Transaction submitted successfully.'));
};
