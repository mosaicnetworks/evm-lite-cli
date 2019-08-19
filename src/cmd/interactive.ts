import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
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

	return Promise.resolve(success());
};
