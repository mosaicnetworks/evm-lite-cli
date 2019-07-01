import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { InvalidConnectionError } from '../errors';

interface Options extends GenericOptions {
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

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

export const stage: StagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(session.debug, args);

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

	let poa: { address: string; abi: any[] };

	try {
		poa = await session.getPOAContract();
	} catch (e) {
		staging.debug('POA contract info fetch error');

		return Promise.reject(e);
	}

	staging.debug('POA contract info fetch successful');

	staging.debug(
		`Successfully connected to ${session.node.host}:${session.node.port}`
	);

	return Promise.resolve(staging.success(`Contract Address: ${poa.address}`));
};
