import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments<Options>) =>
			new InteractiveCommand(session, args).run()
		);
};

class InteractiveCommand extends Command {
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
		return '';
	}
}

export const interactive = InteractiveCommand;
