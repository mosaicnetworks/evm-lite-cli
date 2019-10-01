import Vorpal from 'vorpal';

import Session from '../core/Session';

import Command, { Arguments, Options } from '../core/Command';

type Opts = Options & {};

export type Args = Arguments<Opts> & {};

export default (evmlc: Vorpal, session: Session) => {
	return evmlc
		.command('test')
		.hidden()
		.description('Test command')
		.action((args: Args) => new TestCommand(session, args).run());
};

class TestCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		return false;
	}

	protected async prompt(): Promise<void> {
		// await this.decryptPrompt();

		return;
	}

	protected async check(): Promise<void> {
		return;
	}

	protected async exec(): Promise<string> {
		return JSON.stringify(this.account);
	}
}

export const Test = TestCommand;
