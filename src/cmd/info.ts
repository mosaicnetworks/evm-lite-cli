import ASCIITable from 'ascii-table';
import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';

import { INVALID_CONNECTION, EVM_LITE } from '../errors/generals';

interface Options extends GenericOptions {
	formatted?: boolean;
	host?: string;
	port?: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

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

export const stage: StagingFunction<Arguments, ASCIITable, any> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, ASCIITable, any>(
		session.debug,
		args
	);

	const status = await session.connect(args.options.host, args.options.port);

	const formatted = args.options.formatted || false;

	const host = args.options.host || session.config.state.connection.host;
	const port = args.options.port || session.config.state.connection.port;

	staging.debug(`Attempting to connect: ${host}:${port}`);

	if (!status) {
		return Promise.reject(
			staging.error(
				INVALID_CONNECTION,
				`A connection could be establised to ${host}:${port}`
			)
		);
	}

	let information: any;

	staging.debug(`Attempting to fetch node information...`);

	try {
		information = await session.node.getInfo();
	} catch (e) {
		return Promise.reject(staging.error(EVM_LITE, e.toString()));
	}

	if (!formatted) {
		return Promise.resolve(staging.success(information));
	}

	staging.debug(`Preparing formatted output...`);

	const table = new ASCIITable().setHeading('Key', 'Value');

	for (const key in information) {
		if (information.hasOwnProperty(key)) {
			table.addRow(key, information[key]);
		}
	}

	return Promise.resolve(staging.success(table));
};
