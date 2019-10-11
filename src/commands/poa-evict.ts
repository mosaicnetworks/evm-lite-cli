import * as fs from 'fs';

import Inquirer from 'inquirer';
import Vorpal from 'vorpal';

import Node, { Contract } from 'evm-lite-core';
import Datadir from 'evm-lite-datadir';
import utils from 'evm-lite-utils';

import Session from '../core/Session';

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
		.command('poa evict [address]')
		.alias('p e')
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
		const keystore = await this.datadir.listKeyfiles();
		const questions: Inquirer.QuestionCollection<Answers> = [
			{
				default:
					(this.args.options.from &&
						keystore[this.args.options.from].address) ||
					'',
				message: 'Eviction Nominee Address: ',
				name: 'address',
				type: 'input'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = utils.trimHex(answers.address);
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

		const evictVoteTx = contract.methods.castEvictionVote(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: Number(this.args.options.gasPrice)
			},
			utils.cleanAddress(this.args.address),
			true
		);

		this.startSpinner('Sending Transaction');

		this.debug('Sending eviction transaction');
		const receipt = await this.node!.sendTx(tx, this.account);

		this.debug('Sending evict vote transaction');
		const voteRcpt = await this.node!.sendTx(evictVoteTx, this.account);

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned. ' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		let nomineeDecisionLogs: any[] = [];
		let nomineeDecisionEvent;

		if (!voteRcpt.logs.length) {
			throw Error(
				'No logs returned while voting. \n' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		if (voteRcpt.logs.length > 1) {
			nomineeDecisionLogs = voteRcpt.logs.filter(
				log => log.event === 'EvictionDecision'
			);
		}

		if (nomineeDecisionLogs.length) {
			nomineeDecisionEvent = nomineeDecisionLogs[0];
		}

		let message = '';
		if (nomineeDecisionEvent) {
			const accepted = nomineeDecisionEvent.args._accepted
				? 'being removed'
				: 'not being removed';

			message += `\nEviction ended with the evictee ${accepted}.`;
		}

		this.debug('Parsing logs from receipt');

		// return JSON.stringify(receipt, null, 2);

		const evicteeProposedEvent = receipt.logs.filter(
			log => log.event === 'EvictionProposed'
		)[0];

		this.stopSpinner();

		return (
			`You (${evicteeProposedEvent.args._proposer}) proposed to evict (${evicteeProposedEvent.args._nominee})` +
			message
		);
	}
}

export const POANominate = POAEvictCommand;
