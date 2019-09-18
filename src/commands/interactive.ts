import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
		.description(description)
		.types({
			string: []
		})
		.action((args: IArgs<IOptions>) =>
			new InteractiveCommand(session, args).run()
		);
};

class InteractiveCommand extends Command {
	public async init(): Promise<boolean> {
		return false;
	}

	public async prompt(): Promise<void> {
		return;
	}

	public async check(): Promise<void> {
		return;
	}

	public async exec(): Promise<void> {
		return;
	}
}

export const interactive = InteractiveCommand;
