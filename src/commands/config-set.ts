import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {
	host?: string;
	port?: number;
	from?: string;
	gas?: number;
};

type Args = Arguments<Opts> & {};

type Answers = {
	host: string;
	port: number;
	from: string;
	gas: number;
};

export default (evmlc: Vorpal, session: Session) => {
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
		.types({
			string: ['h', 'host', 'from']
		})
		.action((args: Args) => new ConfigSetCommand(session, args).run());
};

class ConfigSetCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		const config = this.datadir.config;
		const keystore = await this.datadir.listKeyfiles();

		const questions: Inquirer.QuestionCollection<Answers> = [
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
				choices: Object.keys(keystore).map(moniker => moniker),
				default: config.defaults.from,
				message: 'From',
				name: 'from',
				type: 'list'
			},
			{
				default: config.defaults.gas,
				message: 'Gas',
				name: 'gas',
				type: 'number'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.options.host = answers.host;
		this.args.options.port = answers.port;
		this.args.options.gas = answers.gas;
		this.args.options.from = answers.from;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		this.log.info('config', this.datadir.configPath);

		const config = this.datadir.config;

		const newConfig = {
			connection: {
				host: this.args.options.host || config.connection.host,
				port: this.args.options.port || config.connection.port
			},

			defaults: {
				from: this.args.options.from || config.defaults.from,
				gas:
					this.args.options.gas !== undefined &&
					this.args.options.gas >= 0
						? this.args.options.gas
						: config.defaults.gas
			}
		};

		await this.datadir.saveConfig(newConfig);

		return this.datadir.configToml;
	}
}

export const ConfigView = ConfigSetCommand;
