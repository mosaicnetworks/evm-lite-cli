import Vorpal from 'vorpal';

import { color, Session } from '..';

export default (evmlc: Vorpal, session: Session) => {
	const cmd = evmlc.command('help [command...]');

	return cmd
		.description('Provides help for a given command.')
		.action((args: any, cb: any) => {
			color.yellow(
				`\n  Change datadir by: $${session.name} --datadir [path] [command]`
			);

			if (args.command) {
				args.command = args.command.join(' ');
				const name = cmd._parent.commands.find(c => {
					return (
						c._name ===
						String(args.command)
							.toLowerCase()
							.trim()
					);
				});

				if (name && !name._hidden) {
					if (typeof name._help === 'function') {
						name._help(args.command, () => {
							cb();
						});

						return;
					}

					cmd._parent.log(name.helpInformation());
				} else {
					cmd._parent.log(cmd._parent._commandHelp(args.command));
				}
			} else {
				cmd._parent.log(cmd._parent._commandHelp(args.command));
			}

			cb();
		});
};
