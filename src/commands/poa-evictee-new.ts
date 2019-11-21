import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import Session from '../core/Session';
import POA from '../poa/Contract';

import { EvictionProposed, Logs } from '../poa';

import Command, { Arguments, TxOptions } from '../core/TxCommand';

type Opts = TxOptions & {
	interactive?: boolean;
	from: string;
	pwd?: string;
	host: string;
	port: number;
	gas: number;
};

type Args = Arguments<Opts> & {
	address: string;
};

type Answers = {
	address: string;
	nomineeMoniker: string;
};

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Nominate an address to proceed to an eviction vote';

	return evmlc
		.command('poa evictee new [address]')
		.alias('p e n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--pwd <password>', 'passphase file path')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.types({
			string: ['_', 'pwd', 'from', 'h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new POAEvictCommand(session, args).run()
		);
};

class POAEvictCommand extends Command<Args> {
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
		const poa = new POA(this.args.options.host, this.args.options.port);
		await poa.init();

		const whitelist = await poa.whitelist();

		if (whitelist.length === 0) {
			throw Error('No nominees in election');
		}

		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				choices: whitelist.map(n => `${n.moniker} (${n.address})`),
				message: 'Eviction Address: ',
				name: 'address',
				type: 'list'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = utils.trimHex(
			answers.address.split(' ')[1].slice(1, -1)
		);
	}

	protected async check(): Promise<void> {
		if (!this.args.address) {
			throw Error('No nominee address provided.');
		}

		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}

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

		this.debug('Generating eviction nominate transaction');
		const tx = contract.methods.submitEviction(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: Number(this.args.options.gasPrice)
			},
			utils.cleanAddress(this.args.address)
		);

		this.startSpinner('Sending Transaction');

		this.debug('Sending eviction transaction');
		const receipt = await this.node!.sendTx(tx, this.account);

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		this.debug('Parsing logs from receipt');
		const logs = new Logs(receipt.logs);
		const evEvictionProposed = logs.find<EvictionProposed>(
			'EvictionProposed'
		);

		if (!evEvictionProposed) {
			throw Error('Oops! `EvictionProposed` event not found.');
		}

		this.stopSpinner();

		if (this.args.options.json) {
			return JSON.stringify({
				proposer: evEvictionProposed._proposer,
				evictee: evEvictionProposed._nominee
			});
		} else {
			return `You (${evEvictionProposed._proposer}) proposed to evict (${evEvictionProposed._nominee})`;
		}
	}
}

export const POANominate = POAEvictCommand;
