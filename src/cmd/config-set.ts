import * as inquirer from 'inquirer';

import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Globals from '../Globals';
import Session from '../Session';

interface Options extends IOptions {
	interactive?: boolean;
	host?: string;
	port?: number;
	from?: string;
	gas?: number;
	gasprice?: number;
}

export interface Arguments extends Args<Options> {}

export default function commandConfigSet(
	evmlc: Vorpal,
	session: Session
): Command {
	const description =
		'Set values of the configuration inside the data directory';

	return evmlc
		.command('config set')
		.alias('c s')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-h, --host <host>', 'default host')
		.option('-p, --port <port>', 'default port')
		.option('--from <moniker>', 'default from moniker')
		.option('--gas <gas>', 'default gas')
		.option('--gasprice <gasprice>', 'gas price')
		.types({
			string: ['h', 'host', 'from']
		})
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

interface Answers {
	host: string;
	port: number;
	from: string;
	gas: number;
	gasPrice: number;
}

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { options } = args;
	const { state } = session.config;
	const { success, debug } = frames.staging();

	const { list } = frames.keystore();

	/** Command Execution */
	debug(`Successfully read configuration: ${session.config.path}`);

	const keystore = await list();

	const interactive = options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
		{
			default: state.connection.host,
			message: 'Host',
			name: 'host',
			type: 'input'
		},
		{
			default: state.connection.port,
			message: 'Port',
			name: 'port',
			type: 'number'
		},
		{
			choices: Object.keys(keystore).map(moniker => moniker),
			default: state.defaults.from,
			message: 'From',
			name: 'from',
			type: 'list'
		},
		{
			default: state.defaults.gas,
			message: 'Gas',
			name: 'gas',
			type: 'number'
		},
		{
			default: state.defaults.gasPrice,
			message: 'Gas Price',
			name: 'gasPrice',
			type: 'number'
		}
	];

	if (interactive) {
		const answers = await inquirer.prompt<Answers>(questions);

		options.host = answers.host;
		options.port = answers.port;
		options.gas = answers.gas;
		options.gasprice = answers.gasPrice;
		options.from = answers.from;
	}

	const newConfig = {
		connection: {
			host: options.host || state.connection.host,
			port: options.port || state.connection.port
		},
		defaults: {
			from: options.from || state.defaults.from,
			gas:
				options.gas !== undefined && options.gas >= 0
					? options.gas
					: state.defaults.gas,
			gasPrice:
				options.gasprice !== undefined && options.gasprice >= 0
					? options.gasprice
					: state.defaults.gasPrice
		}
	};

	debug(`Attempting to write modified configuration...`);

	await session.config.save(newConfig);

	Globals.info(session.config.toTOML());

	return Promise.resolve(success('Configuration saved'));
};
