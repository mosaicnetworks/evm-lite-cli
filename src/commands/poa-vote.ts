import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import color from '../core/color';
import Session from '../core/Session';

import { NomineeEntry, POANomineeList } from './poa-nomineelist';

import Command, { IArgs, IOptions } from '../core/Command';

interface Opts extends IOptions {
	interactive?: boolean;
	pwd?: string;

	verdict: boolean;
	from: string;
	host: string;
	port: number;
	gas: number;
	gasprice: number;
}

interface Args extends IArgs<Opts> {
	address: string;
}

interface Answers {
	address: string;
	verdict: boolean;
	gas: number;
	gasPrice: number;
}

export default (evmlc: Vorpal, session: Session) => {
	const description = 'Vote for an nominee currently in election';

	return evmlc
		.command('poa vote [address]')
		.alias('p v')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('-d, --debug', 'show debug output')
		.option('--verdict <boolean>', 'verdict for given address')
		.option('--pwd <password>', 'passphrase file path')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.option('-gp, --gasprice <gp>', 'override config gasprice value')
		.types({
			string: ['_', 'from', 'pwd', 'host', 'h']
		})
		.action(
			(args: Args): Promise<void> =>
				new POAVoteCommand(session, args).run()
		);
};

class POAVoteCommand extends Command<Args> {
	public nominees: NomineeEntry[] = [];

	public async init(): Promise<boolean> {
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

	public async prompt(): Promise<void> {
		await this.decryptPrompt();

		const cmd = new POANomineeList(this.session, this.args);

		// initialize cmd execution
		cmd.init();

		this.nominees = await cmd.getNomineeList();

		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				choices: this.nominees.map(
					nominee => `${nominee.moniker} (${nominee.address})`
				),
				message: 'Nominee: ',
				name: 'address',
				type: 'list'
			},
			{
				message: 'Verdict: ',
				name: 'verdict',
				type: 'confirm'
			},
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

		this.args.address = answers.address.split(' ')[1].slice(1, -1);
		this.args.options.verdict = answers.verdict;
		this.args.options.gas = answers.gas;
		this.args.options.gasprice = answers.gasPrice;

		return;
	}

	public async check(): Promise<void> {
		if (!this.args.address) {
			throw Error('No nominee address provided.');
		}

		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}

		if (!this.args.options.verdict && this.args.options.verdict !== false) {
			throw Error('No verdict provided for nominee.');
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

	public async exec(): Promise<void> {
		if (!this.nominees.length) {
			return color.yellow('There are no nominees in election');
		}

		const poa = await this.node!.getPOA();
		const contract = Contract.load(JSON.parse(poa.abi), poa.address);

		// sanity check
		if (!this.account) {
			const keyfile = await this.datadir.getKeyfile(
				this.args.options.from
			);

			this.account = Datadir.decrypt(keyfile, this.passphrase!);
		}

		const tx = contract.methods.castNomineeVote(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: this.args.options.gasprice
			},
			utils.cleanAddress(this.args.address),
			this.args.options.verdict
		);

		const receipt = await this.node!.sendTx(tx, this.account);
		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		const nomineeVoteCastEvent = receipt.logs.filter(
			log => log.event === 'NomineeVoteCast'
		)[0];

		let nomineeDecisionLogs: any[] = [];
		let nomineeDecisionEvent;

		if (receipt.logs.length > 1) {
			nomineeDecisionLogs = receipt.logs.filter(
				log => log.event === 'NomineeVoteCast'
			);
		}

		if (nomineeDecisionLogs.length) {
			nomineeDecisionEvent = nomineeDecisionLogs[0];
		}

		const vote = nomineeVoteCastEvent.args._accepted ? 'Yes' : 'No';

		let message =
			`You (${nomineeVoteCastEvent.args._voter}) voted '${vote}'` +
			` for '${nomineeVoteCastEvent.args._nominee}'. `;

		if (nomineeDecisionEvent) {
			const accepted = nomineeDecisionEvent.args._accepted
				? 'Accepted'
				: 'Rejected';

			message += `\nElection completed with the nominee being '${accepted}'.`;
		}

		return color.green(message);
	}
}

export const POAVote = POAVoteCommand;
