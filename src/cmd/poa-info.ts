import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

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
	const { success, error, debug } = frames.staging();
	const { connect } = frames.generics();

	// config
	const config = session.datadir.config;

	// command execution
	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	await connect(
		host,
		port
	);

	let poa: { address: string; abi: any[] };

	debug(`Attempting to fetch PoA data...`);

	try {
		poa = await session.POA();
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.toString()));
	}

	return Promise.resolve(success(`POA Address: ${poa.address}`));
};
