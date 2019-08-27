import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

import { EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

export default (evmlc: Vorpal, session: Session<Solo>): Command => {
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
};

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, string>(args);

	// prepare
	const { options } = args;

	// handlers
	const { success, error, debug } = staging.handlers(session.debug);

	// hooks
	const { connect } = staging.genericHooks(session);

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
