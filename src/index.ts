#!/usr/bin/env node

/**
 * @file AccountsCreate.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2019
 */

require('dotenv').config();

import * as figlet from 'figlet';
import * as mkdir from 'mkdirp';

import Vorpal from 'vorpal';

import { Utils } from 'evm-lite-keystore';

import Globals from './classes/Globals';
import Session from './classes/Session';

// Accounts
import AccountsCreate from './commands/AccountsCreate';
import AccountsGet from './commands/AccountsGet';
import AccountsList from './commands/AccountsList';
// import AccountsUpdate from './commands/AccountsUpdate';

// Config
import ConfigSet from './commands/ConfigSet';
import ConfigView from './commands/ConfigView';

// Misc
import Clear from './commands/Clear';
import Info from './commands/Info';
import Interactive from './commands/Interactive';

// Transaction
import Transfer from './commands/Transfer';
// import TransactionsGet from './commands/TransactionsGet';
// import TransactionsList from './commands/TransactionsList';

// import LogsClear from "./commands/LogsClear";
// import LogsView from "./commands/LogsView";
// import Test from './commands/Test';

// POA
import POAVote from './commands/POA/Vote';
import POAIsNominee from './commands/POA/IsNominee';
import POANominate from './commands/POA/Nominate';
import POANomineeList from './commands/POA/NomineeList';
import POAShowVotes from './commands/POA/ShowVotes';
import POACheck from './commands/POA/Check';
import POAWhiteList from './commands/POA/WhiteList';

export type CommandFunction = (
	evmlc: Vorpal,
	session: Session
) => Vorpal.Command;

const init = (): Promise<void> => {
	return new Promise<void>(resolve => {
		if (!Utils.exists(Globals.evmlcDir)) {
			mkdir.sync(Globals.evmlcDir);
		}
		resolve();
	});
};

/**
 * EVM-Lite Command Line Interface
 *
 * You can enter interactive mode by using the command `interactive, i`.
 * Running any command will provide you with a step by step dialogue to executing
 * that command with the respective options.
 */
init()
	.then(() => {
		let dataDirPath: string = Globals.evmlcDir;

		if (process.argv[2] === '--datadir' || process.argv[2] === '-d') {
			dataDirPath = process.argv[3];

			if (!Utils.exists(process.argv[3])) {
				Globals.warning(
					'Data directory file path provided does' +
						'not exist and hence will created...'
				);
			}

			process.argv.splice(2, 2);
		}

		const session = new Session(dataDirPath);

		if (!process.argv[2]) {
			console.log(
				'\n  A Command Line Interface to interact with EVM-Lite.'
			);
			console.log(
				`\n  Current Data Directory: ` + session.directory.path
			);

			process.argv[2] = 'help';
		}

		return session;
	})
	.then((session: Session) => {
		const evmlc = new Vorpal();

		[
			// AccountsUpdate,
			ConfigView,
			ConfigSet,
			AccountsCreate,
			AccountsList,
			AccountsGet,
			Interactive,
			Transfer,
			Info,
			// Test,
			// TransactionsList,
			// TransactionsGet,

			// POA
			POANominate,
			POACheck,
			POAVote,
			POAIsNominee,
			POAShowVotes,
			POAWhiteList,
			POANomineeList,

			// LogsView,
			// LogsClear,
			Clear
		].forEach((command: CommandFunction) => {
			command(evmlc, session);
		});

		return {
			instance: evmlc,
			session
		};
	})
	.then(async (cli: { instance: Vorpal; session: Session }) => {
		if (process.argv[2] === 'interactive' || process.argv[2] === 'i') {
			console.log(figlet.textSync('EVM-Lite CLI', {}));
			Globals.warning(` Mode:        Interactive`);
			Globals.warning(` Data Dir:    ${cli.session.directory.path}`);
			Globals.info(` Config File: ${cli.session.config.path}`);

			if (cli.session.keystore) {
				Globals.info(` Keystore:    ${cli.session.keystore.path}`);
			}

			const cmdInteractive = cli.instance.find('interactive');
			if (cmdInteractive) {
				cmdInteractive.hidden();
			}

			await cli.instance.exec('help');

			cli.session.interactive = true;
			cli.instance.delimiter('evmlc$').show();
		} else {
			const cmdClear = cli.instance.find('clear');
			if (cmdClear) {
				cmdClear.hidden();
			}

			cli.instance.parse(process.argv);
		}
	})
	.catch(console.log);
