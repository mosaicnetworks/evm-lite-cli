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
		process.stdout.write('\u001B[2J\u001B[0;0f');
		return '';
	}
}

export const Clear = ClearCommand;
