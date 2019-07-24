#!/usr/bin/env node

// bump `evm-lite-datadir` to `v1.0.0-alpha-16`
// import { osDataDir } from 'evm-lite-datadir';

import * as path from 'path';

// Accounts
import accountsCreate from './cmd/accounts-create';
import accountsGet from './cmd/accounts-get';
import accountsList from './cmd/accounts-list';
import accountsUpdate from './cmd/accounts-update';
import accountsImport from './cmd/accounts-import';

// Config
import configView from './cmd/config-view';
import configSet from './cmd/config-set';

// poa
import poaCheck from './cmd/poa-check';
import poaInfo from './cmd/poa-info';
import poaWhitelist from './cmd/poa-whitelist';
import poaNomineelist from './cmd/poa-nomineelist';
import poaNominate from './cmd/poa-nominate';
import poaVote from './cmd/poa-vote';
import poaInit from './cmd/poa-init';

// Misc
import clear from './cmd/clear';
import debug from './cmd/debug';
import interactive from './cmd/interactive';
import transfer from './cmd/transfer';
import info from './cmd/info';
import version from './cmd/version';
import test from './cmd/test';

import init, { IInit } from './init';

export function osDataDir(dir: string): string {
	const os = require('os')
		.type()
		.toLowerCase();

	switch (os) {
		case 'windows_nt':
			return path.join(
				require('os').homedir(),
				'AppData',
				'Roaming',
				dir.toUpperCase()
			);
		case 'darwin':
			return path.join(
				require('os').homedir(),
				'Library',
				dir.toUpperCase()
			);

		default:
			return path.join(require('os').homedir(), `.${dir.toLowerCase()}`);
	}
}

const params: IInit = {
	name: 'EVM-Lite CLI',
	delimiter: 'evmlc',
	datadir: osDataDir('EVMLC'),
	config: 'evmlc'
};

const commands = [
	// accounts
	accountsCreate,
	accountsGet,
	accountsList,
	accountsUpdate,
	accountsImport,

	// config
	configView,
	configSet,

	// poa
	poaCheck,
	poaWhitelist,
	poaNomineelist,
	poaNominate,
	poaVote,
	poaInfo,
	poaInit,

	// misc
	clear,
	interactive,
	info,
	test,
	version,
	debug,
	transfer
];

init(params, commands).catch(console.log);
