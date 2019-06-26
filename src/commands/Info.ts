import Vorpal from 'vorpal';
import ASCIITable from 'ascii-table';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

export const stage: StagingFunction<ASCIITable, any> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<ASCIITable, any>(args);

		const status = await session.connect(
			args.options.host,
			args.options.port
		);

		if (!status) {
			resolve(staging.error(Staging.ERRORS.INVALID_CONNECTION));
			return;
		}

		const information: any = await session.node.getInfo();
		if (!information) {
			resolve(
				staging.error(
					Staging.ERRORS.FETCH_FAILED,
					'Cannot fetch information.'
				)
			);
			return;
		}

		const formatted = args.options.formatted || false;
		if (!formatted) {
			resolve(staging.success(information));
			return;
		}

		const table = new ASCIITable().setHeading('Name', 'Value');
		for (const key in information) {
			if (information.hasOwnProperty(key)) {
				table.addRow(key, information[key]);
			}
		}

		resolve(staging.success(table));
	});
};

export default function commandInfo(evmlc: Vorpal, session: Session) {
	return evmlc
		.command('info')
		.description('Prints information about node as JSON or --formatted.')
		.option('-f, --formatted', 'format output')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
