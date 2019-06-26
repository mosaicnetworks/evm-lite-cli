import * as fs from 'fs';

import inquirer from 'inquirer';
import Vorpal from 'vorpal';

import { Account } from 'evm-lite-core';
import { Keystore, Utils } from 'evm-lite-keystore';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

interface TransferFromAddressPrompt {
	from: string;
}

interface TransferDecryptPrompt {
	password: string;
}

interface TransferOtherQuestionsPrompt {
	to: string;
	value: string;
	gas: string;
	gasPrice: string;
}

export const stage: StagingFunction<string, string> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<string, string>(args);
		const status = await session.connect(
			args.options.host,
			args.options.port
		);

		if (!status) {
			resolve(staging.error(Staging.ERRORS.INVALID_CONNECTION));
			return;
		}

		const interactive = args.options.interactive || session.interactive;
		const accounts = await session.keystore.list();
		const fromQ = [
			{
				choices: accounts.map(account => account.address),
				message: 'From: ',
				name: 'from',
				type: 'list'
			}
		];
		const passwordQ = [
			{
				message: 'Enter password: ',
				name: 'password',
				type: 'password'
			}
		];
		const restOfQs = [
			{
				message: 'To',
				name: 'to',
				type: 'input'
			},
			{
				default: '100',
				message: 'Value: ',
				name: 'value',
				type: 'input'
			},
			{
				default: session.config.state.defaults.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'input'
			},
			{
				default: session.config.state.defaults.gasPrice || 0,
				message: 'Gas Price: ',
				name: 'gasPrice',
				type: 'input'
			}
		];
		const tx: any = {};

		if (interactive) {
			const { from } = await inquirer.prompt<TransferFromAddressPrompt>(
				fromQ
			);
			args.options.from = from;
		}

		if (!args.options.from) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'`From` address cannot be blank.'
				)
			);
			return;
		}

		const keystore = await session.keystore.get(args.options.from);
		if (!keystore) {
			resolve(
				staging.error(
					Staging.ERRORS.FILE_NOT_FOUND,
					`Cannot find keystore file of address: ${tx.from}.`
				)
			);
			return;
		}

		if (!args.options.pwd) {
			const { password } = await inquirer.prompt<TransferDecryptPrompt>(
				passwordQ
			);
			args.options.pwd = password;
		} else {
			if (!Utils.exists(args.options.pwd)) {
				resolve(
					staging.error(
						Staging.ERRORS.FILE_NOT_FOUND,
						'Password file path provided does not exist.'
					)
				);
				return;
			}

			if (Utils.isDirectory(args.options.pwd)) {
				resolve(
					staging.error(
						Staging.ERRORS.IS_DIRECTORY,
						'Password file path provided is not a file.'
					)
				);
				return;
			}

			args.options.pwd = fs.readFileSync(args.options.pwd, 'utf8');
		}

		let decrypted: Account;
		try {
			decrypted = Keystore.decrypt(keystore, args.options.pwd);
		} catch (err) {
			resolve(
				staging.error(
					Staging.ERRORS.FAILED_DECRYPTION,
					'Failed decryption of account.'
				)
			);
			return;
		}

		if (interactive) {
			const answers = await inquirer.prompt<TransferOtherQuestionsPrompt>(
				restOfQs
			);

			args.options.to = answers.to;
			args.options.value = answers.value;
			args.options.gas = answers.gas;
			args.options.gasPrice = answers.gasPrice;
		}

		tx.from = args.options.from;
		tx.to = args.options.to || undefined;
		tx.value = parseInt(args.options.value, 10) || undefined;
		tx.gas = parseInt(
			args.options.gas || session.config.state.defaults.gas || 100000,
			10
		);
		tx.gasPrice = parseInt(
			args.options.gasPrice ||
				session.config.state.defaults.gasPrice ||
				0,
			10
		);

		if (!tx.to || !tx.value) {
			resolve(
				staging.error(
					Staging.ERRORS.BLANK_FIELD,
					'Provide an address to send to and a value.'
				)
			);
			return;
		}

		try {
			const transaction = Account.prepareTransfer(
				tx.from,
				tx.to,
				tx.value,
				tx.gas,
				tx.gasPrice
			);

			await session.node.sendTransaction(transaction, decrypted);

			// tx.txHash = transaction.hash;
			// tx.date = new Date();

			// await session.database.transactions.insert(
			// 	session.database.transactions.create(tx)
			// );

			resolve(
				staging.success(`Transaction submitted: ${transaction.hash}`)
			);
		} catch (e) {
			resolve(
				staging.error(Staging.ERRORS.OTHER, e.text ? e.text : e.message)
			);
		}
	});
};

export default function commandTransfer(evmlc: Vorpal, session: Session) {
	const description =
		'Initiate a transfer of token(s) to an address. ' +
		'Default values for gas and gas prices are set in the' +
		' configuration file.';

	return evmlc
		.command('transfer')
		.alias('t')
		.description(description)
		.option('-i, --interactive', 'interactive')
		.option('-i, --interactive', 'interactive')
		.option('-v, --value <value>', 'value to send')
		.option('-g, --gas <value>', 'gas to send at')
		.option('-gp, --gasprice <value>', 'gas price to send at')
		.option('-t, --to <address>', 'address to send to')
		.option('-f, --from <address>', 'address to send from')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('--pwd <password>', 'password file path')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['t', 'to', 'f', 'from', 'h', 'host', 'pwd']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
