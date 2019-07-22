import * as mkdir from 'mkdirp';
import * as figlet from 'figlet';

import Vorpal, { Command } from 'vorpal';

import Utils from 'evm-lite-utils';
import chalk from 'chalk';

import Session from './Session';
import Globals from './Globals';

export type CommandFunction = (evmlc: Vorpal, session: Session) => Command;

export default async function init(
	name: string,
	delimiter: string,
	datadir: string,
	commands: CommandFunction[]
) {
	if (!Utils.exists(datadir)) {
		mkdir.sync(datadir);
	}

	let dataDirPath = datadir;

	if (process.argv[2] === '--datadir' || process.argv[2] === '-d') {
		dataDirPath = process.argv[3];

		if (!Utils.exists(process.argv[3])) {
			Globals.warning(
				'Data directory path provided does ' +
					'not exist and will created.'
			);
		}

		process.argv.splice(2, 2);
	}

	const session = new Session(dataDirPath);

	if (!process.argv[2]) {
		console.log('\n  A Command Line Interface to interact with EVM-Lite.');
		console.log(`\n  Current Data Directory: ` + session.directory.path);

		process.argv[2] = 'help';
	}

	const cli = new Vorpal();

	commands.forEach((command: CommandFunction) => {
		command(cli, session);
	});

	if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
		console.log(
			chalk.bold(
				figlet.textSync(name, {
					horizontalLayout: 'full'
				})
			)
		);

		if (process.argv[3] === '-d' || process.argv[3] === '--debug') {
			session.debug = true;
			Globals.warning(` Debug:       True`);
		}

		Globals.warning(` Mode:        Interactive`);
		Globals.info(` Data Dir:    ${session.directory.path}`);
		Globals.purple(` Config File: ${session.config.path}`);

		if (session.keystore) {
			Globals.purple(` Keystore:    ${session.keystore.path}`);
		}

		const cmdInteractive = cli.find('interactive');
		if (cmdInteractive) {
			cmdInteractive.hidden();
		}

		await cli.exec('help');

		session.interactive = true;
		cli.delimiter(`${delimiter}$`).show();
	} else {
		const cmdClear = cli.find('clear');

		if (cmdClear) {
			cmdClear.hidden();
		}

		cli.parse(process.argv);
	}
}
