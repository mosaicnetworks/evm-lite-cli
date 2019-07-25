import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Frames, { execute, IStagingFunction, IOptions } from '../frames';

import { EVM_LITE } from '../errors/generals';

interface Options extends IOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
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

export const stage: IStagingFunction<Arguments, ASCIITable, any> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, ASCIITable, any>(session, args);

	// prepare
	const { options } = args;
	const { state } = session.config;

	const { success, error, debug } = frames.staging();
	const { connect } = frames.generics();

	/** Command Execution */
	const interactive = session.interactive;
	const formatted = options.formatted || false;

	const host = options.host || state.connection.host;
	const port = options.port || state.connection.port;

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
