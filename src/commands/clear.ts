import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Clear output on screen';

	return evmlc
		.command('clear')
		.description(description)
		.types({
			string: []
		})
		.action((args: IArgs<IOptions>) =>
			new ClearCommand(session, args).run()
		);
};

class ClearCommand extends Command {
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
		process.stdout.write('\u001B[2J\u001B[0;0f');
	}
}

export const Clear = ClearCommand;
