#!/usr/bin/env node
import Globals from './Globals';

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
import interactive from './cmd/interactive';
import transfer from './cmd/transfer';
import info from './cmd/info';
import version from './cmd/version';
import test from './cmd/test';

import init from './init';

const name = 'EVM-Lite CLI';
const delimiter = 'evmlc';
const datadir = Globals.evmlcDir;
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
	transfer
];

init(name, delimiter, datadir, commands).catch(console.log);
