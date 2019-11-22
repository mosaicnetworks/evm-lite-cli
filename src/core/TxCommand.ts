import Inquirer from 'inquirer';

import Datadir from 'evm-lite-datadir';

import { IAbstractConsensus, Solo } from 'evm-lite-consensus';
import { Account, Transaction } from 'evm-lite-core';
import { Currency } from 'evm-lite-utils';

import Command, { Arguments, Options } from './Command';
import Session from './Session';

export { Arguments } from './Command';

// default options for all commands
export type TxOptions = Options & {
	gas: number;
	gasPrice: string;
};

type DecryptPrompt = {
	from: string;
	passphrase: string;
};

type GasPrompt = {
	gas: number;
	gasPrice: string;
};

abstract class TxCommand<
	T extends Arguments<TxOptions> = Arguments<TxOptions>,
	TConsensus extends IAbstractConsensus = Solo
> extends Command<T, TConsensus> {
	protected transfer?: boolean;
	protected payable?: boolean;
	protected constant?: boolean;

	constructor(session: Session, args: T) {
		super(session, args);
	}

	protected async sendTx(
		tx: Transaction,
		account: Account,
		msg: string = 'Sending Transaction'
	) {
		if (this.node) {
			this.startSpinner(msg);
			const receipt = await this.node.sendTx(tx, account);
			this.stopSpinner();

			this.debug(JSON.stringify(receipt));

			return receipt;
		} else {
			this.debug(
				'Node was not instansiated. ' +
					'Make sure a `Node` object is instansitated in `this.init`'
			);
			throw Error('No connection detected!');
		}
	}

	protected async callTx<T>(
		tx: Transaction,
		msg: string = 'Sending Call Transaction'
	) {
		if (this.node) {
			this.startSpinner(msg);
			const receipt = await this.node.callTx<T>(tx);
			this.stopSpinner();

			this.debug(JSON.stringify(receipt));

			return receipt;
		} else {
			this.debug(
				'Node was not instansiated. ' +
					'Make sure a `Node` object is instansitated in `this.init`'
			);
			throw Error('No connection detected!');
		}
	}

	protected async transferTo(to: string, amount: string) {
		if (this.node) {
			if (!this.account) {
				this.debug(
					'`this.account` was not decrypted properly. ' +
						'Make sure a `this.account` is instansitated'
				);

				throw Error('No account decryped to transfer coins from');
			}

			this.startSpinner('Sending Transaction');
			const receipt = await this.node!.transfer(
				this.account,
				to,
				amount,
				21000,
				Number(this.args.options.gasPrice)
			);

			this.debug(JSON.stringify(receipt));

			return receipt;
		} else {
			throw Error('No connection detected!');
		}
	}

	protected async initQueue(): Promise<boolean> {
		const init = await this.init();

		if (!this.node) {
			throw Error('No node assigned');
		}

		const info = await this.node.getInfo<any>();
		const curr = new Currency(parseInt(info.min_gas_price, 10));

		this.args.options.gasPrice = curr.format('a').slice(0, -1);

		return init;
	}

	protected async promptQueue(): Promise<void> {
		if (this.payable) {
			await this.decryptPrompt();
		}

		await this.prompt();

		if (this.payable || this.constant) {
			await this.gasPrompt();
		}
	}

	protected async gasPrompt() {
		if (this.transfer) {
			this.args.options.gas = 21000;
			return;
		}

		if (this.constant) {
			this.args.options.gas = this.config.defaults.gas || 1000000000;
			return;
		}

		const questions: Inquirer.QuestionCollection<GasPrompt> = [
			{
				message: 'Gas: ',
				name: 'gas',
				type: 'number',
				default: this.config.defaults.gas
			}
		];

		const answers = await Inquirer.prompt<GasPrompt>(questions);

		this.args.options.gas = answers.gas;
		return;
	}

	protected async decryptPrompt() {
		const keystore = await this.datadir.listKeyfiles();

		if (!this.node) {
			throw Error('No node assigned to command');
		}

		// check connection
		await this.node.getInfo();

		// fetch account balances
		const accounts: any = await Promise.all(
			Object.keys(keystore).map(async moniker => {
				const base = await this.node!.getAccount(
					keystore[moniker].address
				);

				return {
					...base,
					moniker
				};
			})
		);

		const defaultAccount =
			accounts.filter(
				(a: any) =>
					a.moniker.toLowerCase() ===
					this.config.defaults.from.toLowerCase()
			)[0] || undefined;

		const questions: Inquirer.QuestionCollection<DecryptPrompt> = [
			{
				choices: accounts.map(
					(acc: any) => `${acc.moniker} (${acc.balance.format('T')})`
				),
				message: 'From: ',
				name: 'from',
				type: 'list'
			},
			{
				message: 'Passphrase: ',
				name: 'passphrase',
				type: 'password'
			}
		];

		if (defaultAccount) {
			// @ts-ignore
			const fromQ: any = questions[0];

			fromQ.default = `${
				defaultAccount.moniker
			} (${defaultAccount.balance.format('T')})`;
		}

		const answers = await Inquirer.prompt<DecryptPrompt>(questions);

		this.startSpinner('Decrypting...');

		const from = answers.from.split(' ')[0];
		if (!from) {
			throw Error('`from` moniker not provided.');
		}

		if (!answers.passphrase) {
			throw Error('Passphrase not provided.');
		}

		const keyfile = await this.datadir.getKeyfile(from);

		this.account = Datadir.decrypt(keyfile, answers.passphrase.trim());

		this.stopSpinner();
	}
}

export default TxCommand;
