import Vorpal, { Args, Command } from 'vorpal';

import Frames, { execute, IOptions, IStagingFunction } from '../frames';
import Session from '../Session';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {}

export default function command(evmlc: Vorpal, session: Session): Command {
	const description = 'Output current configuration file';

	return evmlc
		.command('config view')
		.alias('c v')
		.option('-d, --debug', 'show debug output')
		.description(description)
		.action(
			(args: Arguments): Promise<void> => execute(stage, args, session)
		);
}

export const stage: IStagingFunction<Arguments, string, string> = async (
	args: Arguments,
	session: Session
) => {
	const frames = new Frames<Arguments, string, string>(session, args);

	// prepare
	const { debug, success } = frames.staging();

	/** Command Execution */
	debug(`Reading config file: ${session.datadir.configPath}`);

	return Promise.resolve(success(session.datadir.configToml));
};
