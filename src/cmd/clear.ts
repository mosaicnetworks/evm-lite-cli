import Vorpal, { Args } from 'vorpal';

import Session from '../Session';

interface Options {}

interface Arguments extends Args<Options> {
	options: Options;
}

export default function commandClear(evmlc: Vorpal, _: Session) {
	return evmlc
		.command('clear')
		.description('Clears interactive mode console output')
		.action(
			(_: Arguments): Promise<void> => {
				return new Promise<void>(resolve => {
					process.stdout.write('\u001B[2J\u001B[0;0f');
					resolve();
				});
			}
		);
}
