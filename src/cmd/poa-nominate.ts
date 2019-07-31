import * as fs from 'fs';
import * as inquirer from 'inquirer';

import Vorpal, { Command, Args } from 'vorpal';

import Utils from 'evm-lite-utils';

import Session from '../Session';
import Frames, {
	execute,
	IStagingFunction,
	IOptions,
	IStagedOutput
} from '../frames';

import { POA_NOMINATE } from '../errors/poa';
import { TRANSACTION } from '../errors/generals';

interface Options extends IOptions {
	interactive?: boolean;
	from?: string;
	pwd?: string;
	moniker?: string;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
	address?: string;
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
		.option('--from <moniker>', 'from moniker')
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
	nomineeMoniker: string;
}

export type Output = IStagedOutput<Arguments, string, string>;

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { options } = args;
	const { state } = session.config;

	// generate success, error, debug handlers
	const { debug, success, error } = frames.staging();

	// generate frames
	const { connect } = frames.generics();
	const { send } = frames.transaction();
	const { list, decrypt, get } = frames.keystore();
	const { contract: getContract } = frames.POA();

	/** Command Execution */
	let passphrase: string = '';

	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

	const interactive = args.options.interactive || session.interactive;

	await connect(
		host,
		port
	);

	const contract = await getContract();

	let keystore = await list();

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
		},
		{
			message: 'Nominee: ',
			name: 'address',
			type: 'input'
		},
		{
			message: 'Moniker: ',
			name: 'nomineeMoniker',
			type: 'input'
		}
	];

	if (interactive) {
		const {
			address,
			from,
			passphrase: p,
			nomineeMoniker
		} = await inquirer.prompt<Answers>(questions);

		debug(`Nominee Moniker: ${nomineeMoniker || 'null'}`);
		debug(`Nominee address: ${address || 'null'}`);
		debug(`From address: ${from || 'null'}`);
		debug(`Passphrase: ${p || 'null'}`);

		args.address = Utils.trimHex(address);
		options.from = from;
		options.moniker = nomineeMoniker;

		passphrase = p;
	}

	if (!args.address) {
		return Promise.reject(
			error(POA_NOMINATE.ADDRESS_EMPTY, 'No nominee address provided.')
		);
	}

	if (!options.moniker) {
		return Promise.reject(
			error(
				POA_NOMINATE.MONIKER_EMPTY,
				'No moniker provided for nominee.'
			)
		);
	}

	args.address = Utils.trimHex(args.address);

	if (args.address.length !== 40) {
		return Promise.reject(
			error(
				POA_NOMINATE.ADDRESS_INVALID_LENGTH,
				'Nominee address has an invalid length.'
			)
		);
	}

	debug(`Nominee address validated: ${args.address}`);

	const from = Utils.trimHex(options.from || state.defaults.from);

	if (!from) {
		return Promise.reject(
			error(
				POA_NOMINATE.FROM_EMPTY,
				'No `from` moniker provided or set in config.'
			)
		);
	}

	debug(`From moniker validated: ${from}`);

	if (!passphrase) {
		debug(`Passphrase path: ${options.pwd || 'null'}`);

		if (!options.pwd) {
			return Promise.reject(
				error(
					POA_NOMINATE.PWD_PATH_EMPTY,
					'Passphrase file path not provided.'
				)
			);
		}

		if (!Utils.exists(options.pwd)) {
			return Promise.reject(
				error(
					POA_NOMINATE.PWD_PATH_NOT_FOUND,
					'Passphrase file path provided does not exist.'
				)
			);
		}

		if (Utils.isDirectory(options.pwd)) {
			return Promise.reject(
				error(
					POA_NOMINATE.PWD_IS_DIR,
					'Passphrase file path provided is a directory.'
				)
			);
		}

		passphrase = fs.readFileSync(options.pwd, 'utf8').trim();

		debug(`Passphrase read successfully: ${passphrase}`);
	}

	const keyfile = await get(from);
	const decrypted = await decrypt(keyfile, passphrase);

	debug(`Attempting to generate transaction...`);

	// could be going wrong here.
	const transaction = contract.methods.submitNominee(
		{
			from: keyfile.address,
			gas: session.config.state.defaults.gas,
			gasPrice: session.config.state.defaults.gasPrice
		},
		Utils.cleanAddress(args.address),
		options.moniker
	);

	let receipt = await send(transaction, decrypted);

	if (!receipt.logs.length) {
		return Promise.reject(
			error(
				TRANSACTION.EMPTY_LOGS,
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			)
		);
	}

	debug(`Received transaction logs and parsing...`);

	let monikerAnnouceEvent;
	const monikerAnnouceEvents = receipt.logs.filter(
		log => log.event === 'MonikerAnnounce'
	);

	const nomineeProposedEvent = receipt.logs.filter(
		log => log.event === 'NomineeProposed'
	)[0];

	debug(`Parsing 'MonikerAnnouce' events...`);
	if (monikerAnnouceEvents.length > 1) {
		try {
			monikerAnnouceEvent = monikerAnnouceEvents.filter(event => {
				const moniker = Utils.hexToString(
					event.args._moniker
				).toLowerCase();

				if (moniker.trim() === options.moniker!.trim()) {
					return event;
				}
			})[0];
		} catch (e) {
			return Promise.reject(
				error(
					TRANSACTION.EMPTY_LOGS,
					'No logs were returned matching the specified `moniker`.'
				)
			);
		}
	} else {
		monikerAnnouceEvent = monikerAnnouceEvents[0];
	}

	debug(`Preparing output...`);

	if (!monikerAnnouceEvent) {
		return Promise.reject(
			error(
				TRANSACTION.EMPTY_LOGS,
				'No logs were returned matching the specified `moniker`.'
			)
		);
	}

	const returnData = `You (${
		nomineeProposedEvent.args._proposer
	}) nominated '${Utils.hexToString(monikerAnnouceEvent.args._moniker)}' (${
		nomineeProposedEvent.args._nominee
	})`;

	return Promise.resolve(success(returnData));
};
