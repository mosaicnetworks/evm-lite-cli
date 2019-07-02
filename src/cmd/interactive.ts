import Vorpal from 'vorpal';

import Session from '../Session';

export default function command(evmlc: Vorpal, _: Session) {
	const description = 'Enter interactive mode';

	return evmlc
		.command('interactive')
		.alias('i')
		.description(description)
		.action(
			(): Promise<void> => {
				return new Promise<void>(resolve => resolve());
			}
		);
}
