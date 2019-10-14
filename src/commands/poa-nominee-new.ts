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
	moniker: string;
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
	const description = 'Nominate an address to proceed to election';

	return evmlc
		.command('poa nominee new [address]')
		.alias('p n n')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('--pwd <password>', 'passphase file path')
		.option('--moniker <moniker>', 'moniker of the nominee')
		.option('--from <moniker>', 'from moniker')
		.option('-h, --host <ip>', 'override config host value')
		.option('-p, --port <port>', 'override config port value')
		.option('-g, --gas <g>', 'override config gas value')
		.types({
			string: ['_', 'pwd', 'moniker', 'from', 'h', 'host']
		})
		.action(
			(args: Args): Promise<void> =>
				new POANominateCommand(session, args).run()
		);
};

class POANominateCommand extends Command<Args> {
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
				message: 'Nominee Address: ',
				name: 'address',
				type: 'input'
			},
			{
				default: this.args.options.from || '',
				message: 'Nominee Moniker: ',
				name: 'nomineeMoniker',
				type: 'input'
			}
		];

		const answers = await Inquirer.prompt<Answers>(questions);

		this.args.address = utils.trimHex(answers.address);

		this.args.options.moniker = answers.nomineeMoniker;
	}

	protected async check(): Promise<void> {
		if (!this.args.address) {
			throw Error('No nominee address provided.');
		}

		if (utils.trimHex(this.args.address).length !== 40) {
			throw Error('Nominee address has an invalid length.');
		}

		if (!this.args.options.moniker) {
			throw Error('No moniker provided for nominee.');
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

		this.debug('Generating nominate transaction');
		const tx = contract.methods.submitNominee(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: Number(this.args.options.gasPrice)
			},
			utils.cleanAddress(this.args.address),
			this.args.options.moniker
		);

		const voteTx = contract.methods.castNomineeVote(
			{
				from: this.account.address,
				gas: this.args.options.gas,
				gasPrice: Number(this.args.options.gasPrice)
			},
			utils.cleanAddress(this.args.address),
			true
		);

		this.startSpinner('Sending Transaction');

		this.debug('Sending nominate transaction');
		const receipt = await this.node!.sendTx(tx, this.account);

		this.debug('Sending vote transaction');
		const voteRcpt = await this.node!.sendTx(voteTx, this.account);

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
				log => log.event === 'NomineeDecision'
			);
		}

		if (nomineeDecisionLogs.length) {
			nomineeDecisionEvent = nomineeDecisionLogs[0];
		}

		let message = '';
		if (nomineeDecisionEvent) {
			const accepted = nomineeDecisionEvent.args._accepted
				? 'Accepted'
				: 'Rejected';

			message += `\nElection completed with the nominee being '${accepted}'.`;
		}

		if (!receipt.logs.length) {
			throw Error(
				'No logs were returned while nominating. \n' +
					'Possibly due to lack of `gas` or may not be whitelisted.'
			);
		}

		this.debug('Parsing logs from receipt');

		let monikerAnnouceEvent;
		const monikerAnnouceEvents = receipt.logs.filter(
			log => log.event === 'MonikerAnnounce'
		);

		const nomineeProposedEvent = receipt.logs.filter(
			log => log.event === 'NomineeProposed'
		)[0];

		if (monikerAnnouceEvents.length > 1) {
			try {
				monikerAnnouceEvent = monikerAnnouceEvents.filter(event => {
					const moniker = utils
						.hexToString(event.args._moniker)
						.toLowerCase();

					if (moniker.trim() === this.args.options.moniker.trim()) {
						return event;
					}
				})[0];
			} catch (e) {
				throw Error(
					'No logs were returned matching the specified `moniker`.'
				);
			}
		} else {
			monikerAnnouceEvent = monikerAnnouceEvents[0];
		}

		if (!monikerAnnouceEvent) {
			throw Error(
				'No logs were returned matching the specified `moniker`.'
			);
		}

		this.stopSpinner();

		return (
			`You (${
				nomineeProposedEvent.args._proposer
			}) nominated '${utils.hexToString(
				monikerAnnouceEvent.args._moniker
			)}' (${nomineeProposedEvent.args._nominee}).` + message
		);
	}
}

export const POANominate = POANominateCommand;
