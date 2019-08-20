import ASCIITable from 'ascii-table';
import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions } from '../staging';

import { EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	return evmlc
		.command('info')
		.description('Display information about node')
		.option('-f, --formatted', 'format output')
		.option('-d, --debug', 'show debug output')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage = async (args: Arguments, session: Session<Solo>) => {
	const staging = new Staging<Arguments, ASCIITable, any>(args);

	// prepare
	const { options } = args;

	// handlers
	const { success, error, debug } = staging.handlers(session.debug);

	// hooks
	const { connect } = staging.genericHooks(session);

	// config
	const config = session.datadir.config;

	// command execution
	const interactive = session.interactive;
	const formatted = options.formatted || false;

	const host = options.host || config.connection.host;
	const port = options.port || config.connection.port;

	await connect(
		host,
		port
	);

	let information: any;

	debug(`Attempting to fetch node information...`);

	try {
		information = await session.node.getInfo();
	} catch (e) {
		return Promise.reject(error(EVM_LITE, e.toString()));
	}

	if (!formatted && !interactive) {
		return Promise.resolve(success(information));
	}

	debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading('Key', 'Value');

	for (const key in information) {
		if (information.hasOwnProperty(key)) {
			table.addRow(key, information[key]);
		}
	}

	return Promise.resolve(success(table));
};
