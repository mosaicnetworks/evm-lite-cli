import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { IArgs } from '../core/Command';

export default (evmlc: Vorpal, session: Session): Command => {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
		.description(description)
		.types({
			string: []
		})
		.action((args: IArgs<{}>) =>
			new InteractiveCommand(session, args).run()
		);
};

class InteractiveCommand extends Command {
	protected async init(): Promise<boolean> {
		return false;
	}

	protected async interactive(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<void> {
		return;
	}
}

export const interactive = InteractiveCommand;
