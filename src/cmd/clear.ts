import Vorpal, { Args, Command } from 'vorpal';

import Solo from 'evm-lite-solo';

import Session from '../Session';
import Staging, { execute, IOptions, IStagingFunction } from '../staging';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(
	evmlc: Vorpal,
	session: Session<Solo>
): Command {
	const description = 'Clear output on screen';

	return evmlc
		.command('clear')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: IStagingFunction<Solo, Arguments, void, void> = async (
	args: Arguments,
	session: Session<Solo>
) => {
	const staging = new Staging<Arguments, void, void>(args);

	// prepare
	const { success } = staging.handlers(session.debug);

	// command execution
	process.stdout.write('\u001B[2J\u001B[0;0f');

	return Promise.resolve(success());
};
