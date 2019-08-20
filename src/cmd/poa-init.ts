import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';
import utils from 'evm-lite-utils';

import Transaction from 'evm-lite-transaction';

import Session from '../Session';
import Staging, { execute, IOptions, IStagedOutput } from '../staging';

import { TRANSACTION } from '../errors/generals';
import { POA_INIT } from '../errors/poa';

interface Options extends IOptions {
	interactive?: boolean;
	from?: string;
	pwd?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

export default function command(
	monet: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'Initialize PoA contract';

	return monet
		.command('poa init')
		.hidden()
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('--pwd <password>', 'passphase file path')
		.option('--from <moniker>', 'from moniker')
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

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	// deconstruct options
	const { options } = args;

	// config
	const config = session.datadir.config;

	// generate success, error, debug handlers
	const { debug, success, error } = staging.handlers(session.debug);

	// generate frhooksames
	const { connect } = staging.genericHooks(session);
	const { send } = staging.txHooks(session);
	const { list, decrypt, get } = staging.keystoreHooks(session);
	const { contract: getContract } = staging.poaHooks(session);

	// command execution
	const interactive = options.interactive || session.interactive;

	await connect(
		options.host || config.connection.host,
		options.port || config.connection.port
	);

	let passphrase: string = '';

	const contract = await getContract();
	const keystore = await list();

	const questions: inquirer.Questions<Answers> = [
		{
			choices: Object.keys(keystore).map(moniker => moniker),
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

	if (interactive) {
		const { from: f, passphrase: p } = await inquirer.prompt<Answers>(
			questions
		);

		options.from = f;
		passphrase = p;

		debug(`From received: ${f}`);
		debug(`Passphrase received: ${p}`);
	}

	const from = utils.trimHex(options.from || config.defaults.from);

	if (!from) {
		return Promise.reject(
			error(
				POA_INIT.ADDRESS_EMPTY,
				'No `from` moniker provided or set in config.'
			)
		);
	}

	debug(`'from' moniker validated: ${from}`);

	if (!passphrase) {
		debug(`Passphrase path: ${options.pwd || 'null'}`);

		if (!options.pwd) {
			return Promise.reject(
				error(
					POA_INIT.PWD_PATH_EMPTY,
					'Passphrase file path not provided.'
				)
			);
		}

		if (!utils.exists(options.pwd)) {
			return Promise.reject(
				error(
					POA_INIT.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (utils.isDirectory(options.pwd)) {
			return Promise.reject(
				error(
					POA_INIT.PWD_IS_DIR,
					'Passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(options.pwd, 'utf8').trim();

		debug(`Passphrase read successfully: ${passphrase}`);
	}

	const keyfile = await get(from);
	const decrypted = await decrypt(keyfile, passphrase);

	let transaction: Transaction;

	debug(`Attempting to generate transaction...`);

	try {
		transaction = contract.methods.init({
			from: keyfile.address,
			gas: config.defaults.gas,
			gasPrice: config.defaults.gasPrice
		});
	} catch (e) {
		return Promise.reject(error(TRANSACTION.GENERATION, e.toString()));
	}

	const receipt = await send(transaction, decrypted);

	if (!receipt.logs.length) {
		return Promise.reject(
			error(
				TRANSACTION.EMPTY_LOGS,
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			)
		);
	}

	return Promise.resolve(
		success('Initialized PoA contract with initial whitelist.')
	);
};
