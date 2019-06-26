import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { ConfigurationSchema } from 'evm-lite-datadir';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

export const stage: StagingFunction<string, string> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<string, string>(args);

		const interactive = args.options.interactive || session.interactive;
		const questions: any[] = [];

		function populateQuestions(object: ConfigurationSchema) {
			questions.push({
				default: object.connection.host,
				message: 'Host',
				name: 'host',
				type: 'input'
			});
			questions.push({
				default: object.connection.port,
				message: 'Port',
				name: 'port',
				type: 'input'
			});
			questions.push({
				default: object.defaults.from,
				message: 'From',
				name: 'from',
				type: 'input'
			});
			questions.push({
				default: object.defaults.gas,
				message: 'Gas',
				name: 'gas',
				type: 'input'
			});
			questions.push({
				default: object.defaults.gasPrice,
				message: 'Gas Price',
				name: 'gasPrice',
				type: 'input'
			});
		}

		populateQuestions(session.config.state);

		if (interactive) {
			const answers: any = await inquirer.prompt(questions);
			for (const key in answers) {
				if (answers.hasOwnProperty(key)) {
					args.options[key.toLowerCase()] = answers[key];
				}
			}
		}

		if (!Object.keys(args.options).length && !interactive) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'No options provided.'
				)
			);
			return;
		}

		const newConfig = {
			connection: {
				host: args.options.host,
				port: args.options.port
			},
			defaults: {
				from: args.options.from,
				gas: parseInt(args.options.gas, 10),
				gasPrice: parseInt(args.options.gasPrice, 10)
			}
		};

		await session.config.save(newConfig);

		resolve(staging.success('Saved configuration.'));
	});
};

export default function commandConfigSet(evmlc: Vorpal, session: Session) {
	const description =
		'Set values of the configuration inside the data directory.';

	return evmlc
		.command('config set')
		.alias('c s')
		.description(description)
		.option('-i, --interactive', 'enter into interactive command')
		.option('-h, --host <host>', 'default host')
		.option('-p, --port <port>', 'default port')
		.option('--from <from>', 'default from')
		.option('--gas <gas>', 'default gas')
		.option('--gasPrice <gasprice>', 'gas price')
		.option('--keystore <path>', 'keystore path')
		.option('--pwd <path>', 'password path')
		.types({
			string: ['h', 'host', 'from', 'keystore', 'pwd']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
