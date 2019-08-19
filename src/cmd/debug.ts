import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Toggle debug mode';

	return evmlc
		.command('debug')
		.alias('d')
		.description(description)
		.types({
			string: []
		})
		.action((args: Arguments) => execute(stage, args, session));
}

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { success } = frames.staging();

	// command execution
	session.debug = !session.debug;

	return Promise.resolve(
		success(`Debug: ${session.debug ? 'Enabled' : 'Disabled'}`)
	);
};
