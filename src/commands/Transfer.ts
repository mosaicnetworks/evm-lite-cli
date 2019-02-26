/**
 * @file Transfer.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2018
 */

import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as Vorpal from 'vorpal';

import { Account, Static } from 'evm-lite-lib';

import Staging, {
	execute,
	Message,
	StagedOutput,
	StagingFunction
} from '../classes/Staging';

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

/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `transfer` command
 * and resolve a success or an error.
 *
 * @param args - Arguments to the command.
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export const stage: StagingFunction = (
	args: Vorpal.Args,
	session: Session
): Promise<StagedOutput<Message>> => {
	return new Promise<StagedOutput<Message>>(async resolve => {
		const { error, success } = Staging.getStagingFunctions(args);

		const connection = await session.connect(
			args.options.host,
			args.options.port
		);
		if (!connection) {
			resolve(error(Staging.ERRORS.INVALID_CONNECTION));
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
				default: session.config.data.defaults.gas || 100000,
				message: 'Gas: ',
				name: 'gas',
				type: 'input'
			},
			{
				default: session.config.data.defaults.gasPrice || 0,
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
				error(
					Staging.ERRORS.BLANK_FIELD,
					'`From` address cannot be blank.'
				)
			);
			return;
		}

		const keystore = await session.keystore.get(args.options.from);
		if (!keystore) {
			resolve(
				error(
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
			if (!Static.exists(args.options.pwd)) {
				resolve(
					error(
						Staging.ERRORS.FILE_NOT_FOUND,
						'Password file path provided does not exist.'
					)
				);
				return;
			}

			if (Static.isDirectory(args.options.pwd)) {
				resolve(
					error(
						Staging.ERRORS.IS_DIRECTORY,
						'Password file path provided is not a file.'
					)
				);
				return;
			}

			args.options.pwd = fs.readFileSync(args.options.pwd, 'utf8');
		}

		let decrypted: Account = null;
		try {
			decrypted = connection.accounts.decrypt(keystore, args.options.pwd);
		} catch (err) {
			resolve(
				error(
					Staging.ERRORS.DECRYPTION,
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
			args.options.gas || session.config.data.defaults.gas || 100000,
			10
		);
		tx.gasPrice = parseInt(
			args.options.gasPrice || session.config.data.defaults.gasPrice || 0,
			10
		);

		if (!tx.to || !tx.value) {
			resolve(
				error(
					Staging.ERRORS.BLANK_FIELD,
					'Provide an address to send to and a value.'
				)
			);
			return;
		}

		try {
			const transaction = (await session.connection.accounts.prepareTransfer(
				tx.to,
				tx.value,
				tx.from
			))
				.gas(tx.gas)
				.gasPrice(tx.gasPrice);

			await transaction.sign(decrypted);
			await transaction.submit();

			tx.txHash = transaction.hash;
			tx.date = new Date();

			await session.database.transactions.insert(
				session.database.transactions.create(tx)
			);

			resolve(success(`Transaction submitted: ${transaction.hash}`));
		} catch (e) {
			resolve(error(Staging.ERRORS.OTHER, e.text ? e.text : e.message));
		}
	});
};

/**
 * Should construct a Vorpal.Command instance for the command `transfer`.
 *
 * @remarks
 * Allows you to transfer token(s) from one account to another.
 *
 * Usage: `transfer
 * --from 0x583560ee73713a6554c463bd02349841cd79f6e2
 * --to 0x546756ee73713a6554c463bd02349841cd79f6e2
 * --value 200
 * --pwd ~/pwd.txt
 * --gas 1000000
 * --gasprice 0`
 *
 * Here we have requested the transfer of `200` tokens to the specified
 * address from `0x583560ee73713a6554c463bd02349841cd79f6e2`.
 * The default `gas` and `gasprice` can be set in the configuration file
 * to be used for all transfers.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandTransfer(evmlc: Vorpal, session: Session) {
	const description =
		'Initiate a transfer of token(s) to an address. ' +
		'Default values for gas and gas prices are set in the' +
		' configuration file.';

	return evmlc
		.command('transfer')
		.alias('t')
		.description(description)
		.option('-i, --interactive', 'value to send')
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
