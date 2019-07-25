import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Frames, { execute, IStagingFunction, IOptions } from '../frames';

import { EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Display Proof of Authority information';

	return evmlc
		.command('poa info')
		.description(description)
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { options } = args;
	const { state } = session.config;

	const { success, error, debug } = frames.staging();
	const { connect } = frames.generics();

	/** Command Execution */
	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

	await connect(
		host,
		port
	);

	let poa: { address: string; abi: any[] };

	debug(`Attempting to fetch PoA data...`);

	try {
		poa = await session.getPOAContract();
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.toString()));
	}

	return Promise.resolve(success(`POA Address: ${poa.address}`));
};
