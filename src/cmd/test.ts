import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {
	value: any;
}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Test command';

	return evmlc
		.command('test')
		.hidden()
		.description(description)
		.option('--value <value>', 'test valye')
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

	const { success } = frames.staging();

	return Promise.resolve(success(`test`));
};
