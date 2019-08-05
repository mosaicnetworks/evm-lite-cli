import ASCIITable from 'ascii-table';

import { Args as VorpalArgs } from 'vorpal';

import Globals from '../Globals';
import Session from '../Session';

import { IOptions, IStagingFunction } from './Frames';

export const execute = <
	TArguments extends VorpalArgs<IOptions>,
	TFormatted,
	TNormal
>(
	fn: IStagingFunction<TArguments, TFormatted, TNormal>,
	args: TArguments,
	session: Session
): Promise<void> => {
	return new Promise<void>(async resolve => {
		try {
			const output = await fn(args, session);

			let message: string = '';

			if (output.display !== undefined) {
				switch (typeof output.display) {
					case 'boolean':
						message = output.display ? 'Yes' : 'No';
						break;
					case 'string':
						message = output.display;
						break;
					case 'object':
						if (output.display instanceof ASCIITable) {
							message = output.display.toString();
						} else {
							message = JSON.stringify(output.display);
						}
						break;
				}
			}

			Globals[output.display !== undefined ? 'success' : 'error'](
				`${message.charAt(0).toUpperCase() + message.slice(1)}`
			);
		} catch (e) {
			let error: string = 'Critical Error: No stack trace availiable';

			if (e && e.error) {
				if (e.error.type && e.error.message) {
					const type = e.error.type as string;

					if (type.startsWith('@error')) {
						if (e.error.message.startsWith('Error:')) {
							error = `${e.error.message}`;
						} else {
							error = `${e.error.message}`;
						}
					}
				} else {
					error = e.toString();
				}
			}

			Globals.error(error);
		}

		resolve();
	});
};
