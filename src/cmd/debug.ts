import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Frames, { execute, IStagingFunction, IOptions } from '../frames';

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

	/** Command Execution */
	session.debug = !session.debug;

	return Promise.resolve(
		success(`Debug: ${session.debug ? 'Enabled' : 'Disabled'}`)
	);
};
