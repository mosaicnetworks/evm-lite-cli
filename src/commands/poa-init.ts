import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;
	from: string;
	pwd: string;
	host: string;
	port: number;
	gas: number;
	gasprice: number;
}

interface Args extends IArgs<Opts> {}

interface Answers {
	gas: number;
	gasPrice: number;
}

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Initialize PoA contract';

	return evmlc
		.command('poa init')
		.hidden()
		.description(description)
		.option('-i, --interactive', 'enter interactive mode')
		.option('--pwd <password>', 'passphase file path')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.option('-gp, --gasprice <gp>', 'override config gasprice value')
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
		this.args.options.interactive =
			this.args.options.interactive || this.session.interactive;

		this.args.options.host =
			this.args.options.host || this.config.connection.host;
		this.args.options.port =
			this.args.options.port || this.config.connection.port;

		if (!this.args.options.gas && this.args.options.gas !== 0) {
			this.args.options.gas = this.config.defaults.gas;
		}

		if (!this.args.options.gasprice && this.args.options.gasprice !== 0) {
			this.args.options.gasprice = this.config.defaults.gasPrice;
		}

		this.args.options.from =
			this.args.options.from || this.config.defaults.from;

		this.node = new Node(this.args.options.host, this.args.options.port);

		return this.args.options.interactive;
	}

	protected async prompt(): Promise<void> {
		await this.decryptPrompt();

		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				default: this.args.options.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'number'
			},
			{
				default: this.args.options.gasprice || 0,
				message: 'Gas Price: ',
				name: 'gasPrice',
				type: 'number'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.options.gas = answers.gas;
		this.args.options.gasprice = answers.gasPrice;
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

	protected async exec(): Promise<void> {
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

		const tx = contract.methods.init({
			from: this.account.address,
			gas: this.config.defaults.gas,
			gasPrice: this.config.defaults.gasPrice
		});

		const receipt = await this.node!.sendTx(tx, this.account);
		const r = {
			...receipt
		};

		r.logs = receipt.logs
			.filter(log => log.event === 'MonikerAnnounce')
			.map(log => {
				log.args._moniker = utils.hexToString(log.args._moniker);

				return log;
			});

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		return color.green(JSON.stringify(r, null, 2));
	}
}

export const POAInit = POAInitCommand;
