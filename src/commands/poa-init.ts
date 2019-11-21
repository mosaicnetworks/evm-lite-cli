import * as fs from 'fs';

import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import Session from '../core/Session';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	from: string;
	pwd: string;
	host: string;
	port: number;
};

type Args = Arguments<Opts> & {};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Initialize PoA contract';

	return evmlc
		.command('poa init')
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('--pwd <password>', 'passphase file path')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.types({
			string: ['_', 'f', 'from', 'host', 'pwd']
		})
		.action(
			(args: Args): Promise<void> =>
				new POAInitCommand(session, args).run()
		);
};

class POAInitCommand extends Command<Args> {
	protected async init(): Promise<boolean> {
		this.payable = true;

		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		this.args.options.from =
			this.args.options.from || this.config.defaults.from;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		return;
	}

	protected async check(): Promise<void> {
		if (!this.account) {
			if (!this.args.options.from) {
				throw Error('No `from` moniker provided or set in config.');
			}

			if (!this.passphrase) {
				if (!this.args.options.pwd) {
					throw Error('Passphrase file path not provided.');
				}

				if (!utils.exists(this.args.options.pwd)) {
					throw Error(
						'Passphrase file path provided does not exist.'
					);
				}

				if (utils.isDirectory(this.args.options.pwd)) {
					throw Error(
						'Passphrase file path provided is a directory.'
					);
				}

				this.passphrase = fs
					.readFileSync(this.args.options.pwd, 'utf8')
					.trim();
			}
		}
	}

	protected async exec(): Promise<string> {
		this.log.http(
			'GET',
			`${this.args.options.host}:${this.args.options.port}/poa`
		);

		const poa = await this.node!.getPOA();

		this.log.info('POA', poa.address);

		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		// sanity check
		if (!this.account) {
			const keyfile = await this.datadir.getKeyfile(
				this.args.options.from
			);

			this.account = Datadir.decrypt(keyfile, this.passphrase!);
		}

		this.debug('Generating init transaction');
		const tx = contract.methods.init({
			from: this.account.address,
			gas: this.args.options.gas,
			gasPrice: Number(this.args.options.gasPrice)
		});

		this.startSpinner('Sending Transaction');

		this.debug('Sending init transaction');
		const receipt = await this.node!.sendTx(tx, this.account);
		const r = {
			...receipt
		};

		this.debug('Parsing logs from receipt');
		r.logs = receipt.logs
			.filter(log => log.event === 'MonikerAnnounce')
			.map(log => {
				log.args._moniker = utils.hexToString(log.args._moniker);

				return log;
			});

		this.stopSpinner();

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		if (this.args.options.json) {
			return JSON.stringify(r);
		} else {
			return `Successfully initialised POA contract`;
		}
	}
}

export const POAInit = POAInitCommand;
