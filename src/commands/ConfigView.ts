import Vorpal from 'vorpal';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

export const stage: StagingFunction<string, string> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(resolve => {
		const staging = new Staging<string, string>(args);
		const message: string =
			`Config file location: ${session.config.path} \n\n` +
			session.config.toTOML();

		resolve(staging.success(message));
	});
};

export default function command(evmlc: Vorpal, session: Session) {
	const description = 'Output current configuration file as JSON.';

	return evmlc
		.command('config view')
		.alias('c v')
		.description(description)
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
