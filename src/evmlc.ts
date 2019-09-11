#!/usr/bin/env node
import { osdatadir } from 'evm-lite-datadir';

import { Solo } from 'evm-lite-consensus';

// Accounts
import accountsCreate from './commands/accounts-create';
import accountsGet from './commands/accounts-get';
import accountsImport from './commands/accounts-import';
import accountsList from './commands/accounts-list';
import accountsUpdate from './commands/accounts-update';

// Config
import configSet from './commands/config-set';
import configView from './commands/config-view';

// poa
import poaCheck from './commands/poa-check';
import poaInfo from './commands/poa-info';
import poaInit from './commands/poa-init';
import poaNominate from './commands/poa-nominate';
import poaNomineelist from './commands/poa-nomineelist';
import poaVote from './commands/poa-vote';
import poaWhitelist from './commands/poa-whitelist';

// Misc
import info from './commands/info';
import test from './commands/test';
import transfer from './commands/transfer';
import version from './commands/version';

import init, { ICLIConfig } from './core/cli';

const params: ICLIConfig = {
	name: 'EVM-Lite CLI',
	delimiter: 'evmlc',
	datadir: osdatadir('evmlite'),
	config: 'evmlc'
};

const commands = [accountsCreate];

init(params, Solo, commands).catch(console.log);
