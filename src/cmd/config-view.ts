import Vorpal, { Command, Args } from 'vorpal';

import Session from '../Session';
import Staging, { execute, IStagingFunction, IOptions } from '../Staging';

interface Options extends IOptions {}

export interface Arguments extends Args<Options> {
	options: Options;
}

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
	const staging = new Staging<Arguments, string, string>(session.debug, args);
	staging.debug(`Reading config file: ${session.config.path}`);

	return Promise.resolve(staging.success(session.config.toTOML()));
};
