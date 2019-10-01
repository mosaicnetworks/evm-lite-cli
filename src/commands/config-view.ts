import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Output current configuration file';

	return evmlc
		.command('config view')
		.alias('c v')
		.description(description)
		.action((args: Arguments<Options>) =>
			new ConfigViewCommand(session, args).run()
		);
};

class ConfigViewCommand extends Command {
	protected async init(): Promise<boolean> {
		return false;
	}

	protected async prompt(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		this.log.info('config', this.datadir.configPath);

		return this.datadir.configToml;
	}
}

export const ConfigView = ConfigViewCommand;
