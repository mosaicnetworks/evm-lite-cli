#!/usr/bin/env node
import { osdatadir } from 'evm-lite-datadir';

// Accounts
import accountsCreate from './cmd/accounts-create';
import accountsGet from './cmd/accounts-get';
import accountsImport from './cmd/accounts-import';
import accountsList from './cmd/accounts-list';
import accountsUpdate from './cmd/accounts-update';

// Config
import configSet from './cmd/config-set';
import configView from './cmd/config-view';

// poa
import poaCheck from './cmd/poa-check';
import poaInfo from './cmd/poa-info';
import poaInit from './cmd/poa-init';
import poaNominate from './cmd/poa-nominate';
import poaNomineelist from './cmd/poa-nomineelist';
import poaVote from './cmd/poa-vote';
import poaWhitelist from './cmd/poa-whitelist';

// Misc
import info from './cmd/info';
import test from './cmd/test';
import transfer from './cmd/transfer';
import version from './cmd/version';

import init, { ICLIConfig } from './init';

const params: ICLIConfig = {
	name: 'EVM-Lite CLI',
	delimiter: 'evmlc',
	datadir: osdatadir('evm-lite'),
	config: 'evmlc',
	consensus: 'solo'
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
	info,
	test,
	version,
	transfer
];

init(params, commands).catch(console.log);
