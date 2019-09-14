import log from 'npmlog';
import Vorpal from 'vorpal';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs } from '../core/Command';

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Output current configuration file';

	return evmlc
		.command('config view')
		.alias('c v')
		.description(description)
		.action((args: IArgs<{}>) =>
			new ConfigViewCommand(session, args).run()
		);
};

class ConfigViewCommand extends Command {
	public async init(): Promise<boolean> {
		return false;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		color.green(this.session.datadir.configToml);
	}
}

export const ConfigView = ConfigViewCommand;
