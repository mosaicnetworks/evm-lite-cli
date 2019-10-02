#!/usr/bin/env node

import { osdatadir } from 'evm-lite-datadir';

// commands
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsImport from './commands/accounts-import';
import accountsList from './commands/accounts-list';
import accountsUpdate from './commands/accounts-update';
import accountsPrivateKey from './commands/accounts-privatekey';

import configSet from './commands/config-set';
import configView from './commands/config-view';

import poaCheck from './commands/poa-check';
import poaInit from './commands/poa-init';
import poaNominate from './commands/poa-nominate';
import poaNomineelist from './commands/poa-nomineelist';
import poaVote from './commands/poa-vote';
import poaWhitelist from './commands/poa-whitelist';

import info from './commands/info';
import test from './commands/test';
import transfer from './commands/transfer';
import version from './commands/version';

import init, { CLIOptions } from './core/cli';

const options: CLIOptions = {
	name: 'EVMLC',
	delimiter: 'evmlc',
	datadir: osdatadir('evmlite'),
	config: 'evmlc'
};

const commands = [
	// accounts
	accountsCreate,
	accountsList,
	accountsGet,
	accountsUpdate,
	accountsImport,
	accountsPrivateKey,

	// config
	configView,
	configSet,

	poaInit,
	poaCheck,
	poaWhitelist,
	poaNomineelist,
	poaNominate,
	poaVote,

	info,
	transfer,
	version,
	test
];

init(options, commands).catch(console.log);
