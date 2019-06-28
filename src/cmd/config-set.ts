import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, StagingFunction, GenericOptions } from '../Staging';
import inquirer = require('inquirer');

interface Options extends GenericOptions {
	interactive: boolean;
	host: string;
	port: number;
	from: string;
	gas: number;
	gasprice: number;
}

export interface Arguments extends Args<Options> {
	options: Options;
}

export default function commandConfigSet(
	evmlc: Vorpal,
	session: Session
): Command {
	const description =
		'Set values of the configuration inside the data directory.';

	return evmlc
		.command('config set')
		.alias('c s')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('-h, --host <host>', 'default host')
		.option('-p, --port <port>', 'default port')
		.option('--from <from>', 'default from')
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

export const stage: StagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const staging = new Staging<Arguments, string, string>(args);

	const config = session.config.state;

	const interactive = args.options.interactive || session.interactive;
	const questions: inquirer.Questions<Answers> = [
		{
			default: config.connection.host,
			message: 'Host',
			name: 'host',
			type: 'input'
		},
		{
			default: config.connection.port,
			message: 'Port',
			name: 'port',
			type: 'number'
		},
		{
			default: config.defaults.from,
			message: 'From',
			name: 'from',
			type: 'input'
		},
		{
			default: config.defaults.gas,
			message: 'Gas',
			name: 'gas',
			type: 'number'
		},
		{
			default: config.defaults.gasPrice,
			message: 'Gas Price',
			name: 'gasPrice',
			type: 'number'
		}
	];

	if (interactive) {
		const answers = await inquirer.prompt<Answers>(questions);

		args.options.host = answers.host;
		args.options.port = answers.port;
		args.options.gas = answers.gas;
		args.options.gasprice = answers.gasPrice;
		args.options.from = answers.from;
	}

	const newConfig = {
		connection: {
			host: args.options.host || config.connection.host,
			port: args.options.port || config.connection.port
		},
		defaults: {
			from: args.options.from || config.defaults.from,
			gas: args.options.gas || config.defaults.gas,
			gasPrice: args.options.gasprice || config.defaults.gasPrice
		}
	};

	await session.config.save(newConfig);

	console.log(session.config.toTOML());

	return Promise.resolve(staging.success('Configuration saved'));
};
