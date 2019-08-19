import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Clear output on screen';

	return evmlc
		.command('clear')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: IStagingFunction<Arguments, void, void> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, void, void>(session, args);

	// prepare
	const { success } = frames.staging();

	// command execution
	process.stdout.write('\u001B[2J\u001B[0;0f');

	return Promise.resolve(success());
};
