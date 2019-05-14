/**
 * @file TransactionList.ts
 * @module evm-lite-cli
 * @author Danu Kumanan <https://github.com/danu3006>
 * @author Mosaic Networks <https://github.com/mosaicnetworks>
 * @date 2019
 */

import * as ASCIITable from 'ascii-table';
import * as Vorpal from 'vorpal';

import { SentTX, Transaction, TX, TXReceipt } from 'evm-lite-lib';

import Staging, { execute, StagingFunction } from '../classes/Staging';

import Session from '../classes/Session';

/**
 * Should return either a Staged error or success.
 *
 * @remarks
 * This staging function will parse all the arguments of the `transactions get`
 * command and resolve a success or an error.
 *
 * @param args - Arguments to the command.
 * @param session - Controls the session of the CLI instance.
 * @returns An object specifying a success or an error.
 *
 * @alpha
 */
export const stage: StagingFunction<ASCIITable, SentTX[]> = (
	args: Vorpal.Args,
	session: Session
) => {
	return new Promise(async resolve => {
		const staging = new Staging<ASCIITable, SentTX[]>(args);

		const connection = await session.connect(
			args.options.host,
			args.options.port
		);
		if (!connection) {
			resolve(staging.error(Staging.ERRORS.INVALID_CONNECTION));
			return;
		}

		const formatted = args.options.formatted || false;
		const verbose = args.options.verbose || false;
		const table = new ASCIITable();

		const transactions = await session.database.transactions.list();
		if (!transactions.length) {
			resolve(staging.success([]));
			return;
		}

		if (!formatted) {
			resolve(staging.success(transactions));
			return;
		}

		if (verbose) {
			table.setHeading(
				'Date Time',
				'Hash',
				'From',
				'To',
				'Value',
				'Gas',
				'Gas Price',
				'Status'
			);
		} else {
			table.setHeading('From', 'To', 'Value', 'Status');
		}

		for (const tx of transactions) {
			let receipt: TXReceipt;

			const txDate = new Date(tx.date);
			const transaction = new Transaction(
				{} as TX,
				session.connection.host,
				session.connection.port,
				false
			);

			if (tx.txHash) {
				transaction.hash = tx.txHash;

				receipt = await transaction.receipt;
			}

			const date =
				txDate.getFullYear() +
				'-' +
				(txDate.getMonth() + 1) +
				'-' +
				txDate.getDate();
			const time =
				txDate.getHours() +
				':' +
				txDate.getMinutes() +
				':' +
				txDate.getSeconds();

			if (verbose) {
				table.addRow(
					`${date} ${time}`,
					tx.txHash,
					tx.from,
					tx.to,
					tx.value,
					tx.gas,
					tx.gasPrice,
					receipt
						? !receipt.status
							? 'Success'
							: 'Failed'
						: 'Failed'
				);
			} else {
				table.addRow(
					tx.from,
					tx.to,
					tx.value,
					receipt
						? !receipt.status
							? 'Success'
							: 'Failed'
						: 'Failed'
				);
			}
		}

		resolve(staging.success(table));
	});
};

/**
 * Should construct a Vorpal.Command instance for the command
 * `transactions list`.
 *
 * @remarks
 * Allows you list all the transactions sent using the CLI and each of
 * its details..
 *
 * Usage: `transactions list --formatted --verbose`
 *
 * Here we have executed a command to list all the transactions sent with the
 * CLI and asked for the `verbose` output of the data which then should be
 * formatted into an ASCII table specified by `formatted`.
 *
 * @param evmlc - The CLI instance.
 * @param session - Controls the session of the CLI instance.
 * @returns The Vorpal.Command instance of `accounts create`.
 *
 * @alpha
 */
export default function commandTransactionsList(
	evmlc: Vorpal,
	session: Session
) {
	const description = 'Lists all submitted transactions with the status.';

	return evmlc
		.command('transactions list')
		.alias('t l')
		.description(description)
		.option('-f, --formatted', 'format output')
		.option('-v, --verbose', 'verbose output')
		.option('-h, --host <ip>', 'override config parameter host')
		.option('-p, --port <port>', 'override config parameter port')
		.types({
			string: ['h', 'host']
		})
		.action(
			(args: Vorpal.Args): Promise<void> => execute(stage, args, session)
		);
}
