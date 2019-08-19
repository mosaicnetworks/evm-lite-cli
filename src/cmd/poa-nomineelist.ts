import ASCIITable from 'ascii-table';

import Vorpal, { Args, Command } from 'vorpal';

import utils from 'evm-lite-utils';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

interface NomineeEntry {
	address: string;
	moniker: string;
	upVotes: number;
	downVotes: number;
}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'List nominees for a connected node';

	return evmlc
		.command('poa nomineelist')
		.alias('p nl')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: ['host', 'h']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage: IStagingFunction<
	Arguments,
	ASCIITable,
	NomineeEntry[]
> = async (args: Arguments, session: Session) => {
	const frames = new Frames<Arguments, ASCIITable, NomineeEntry[]>(
		session,
		args
	);

	// prepare
	const { options } = args;

	// config
	const config = session.datadir.config;

	// generate success, error, debug handlers
	const { debug, success } = frames.staging();

	// generate frames
	const { connect } = frames.generics();
	const { contract: getContract } = frames.POA();
	const { call } = frames.transaction();

	/** Command Execution */
	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	const interactive = session.interactive;
	const formatted = options.formatted || false;

	await connect(
		host,
		port
	);

	const contract = await getContract();

	debug(`Attempting to generate nominee count transaction...`);

	const transaction = contract.methods.getNomineeCount({
		gas: config.defaults.gas,
		gasPrice: config.defaults.gasPrice
	});

	const response: any = await call(transaction);

	const nomineeCount = response.toNumber();
	debug(`Nominee Count: ${response}`);

	if (!nomineeCount) {
		return Promise.resolve(success([]));
	}

	const nominees: NomineeEntry[] = [];

	debug(`Attempting to fetch nominee details...`);

	for (const i of Array.from(Array(nomineeCount).keys())) {
		const nominee: NomineeEntry = {
			address: '',
			moniker: '',
			upVotes: 0,
			downVotes: 0
		};

		const tx = contract.methods.getNomineeAddressFromIdx(
			{
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			i
		);

		nominee.address = await call(tx);

		debug(`Received nominee address: ${nominee.address}`);

		const monikerTx = contract.methods.getMoniker(
			{
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			nominee.address
		);

		const hex: string = await call(monikerTx);

		nominee.moniker = utils.hexToString(hex);

		debug(`Moniker received: ${nominee.moniker}`);

		const votesTransaction = contract.methods.getCurrentNomineeVotes(
			{
				from: config.defaults.from,
				gas: config.defaults.gas,
				gasPrice: config.defaults.gasPrice
			},
			utils.cleanAddress(nominee.address)
		);

		const votes = await call<[string, string]>(votesTransaction);

		nominee.upVotes = parseInt(votes[0], 10);
		nominee.downVotes = parseInt(votes[1], 10);

		nominees.push(nominee);
	}

	if (!formatted && !interactive) {
		return Promise.resolve(success(nominees));
	}

	debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading(
		'Moniker',
		'Address',
		'Up Votes',
		'Down Votes'
	);

	for (const entry of nominees) {
		table.addRow(
			`${entry.moniker.charAt(0).toUpperCase() + entry.moniker.slice(1)}`,
			entry.address,
			entry.upVotes,
			entry.downVotes
		);
	}

	return Promise.resolve(success(table));
};
