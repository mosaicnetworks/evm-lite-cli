import ASCIITable from 'ascii-table';

import { Account, Utils, BaseAccount } from 'evm-lite-core';

import { session } from './stage';

import { Arguments, stage, Output } from '../src/cmd/accounts-get';

import { ACCOUNTS_GET } from '../src/errors/accounts';
import { EVM_LITE_ERROR, INVALID_CONNECTION } from '../src/errors/generals';

describe('accounts-get.ts', () => {
	it('should error with as invalid node conn details', async () => {
		expect.assertions(3);

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 3000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(3000);

			if (output.error) {
				expect(output.error.type).toBe(INVALID_CONNECTION);
			}
		}
	});

	it('should error with as [address] is empty', async () => {
		expect.assertions(4);

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);
			expect(output.args.address).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_GET.ADDRESS_EMPTY);
			}
		}
	});

	it('should error with as [address] is too short', async () => {
		expect.assertions(4);

		const account = Account.create();

		const args: Arguments = {
			address: account.address.slice(3),
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);
			expect(output.args.address).toBe(
				Utils.trimHex(account.address.slice(3))
			);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_GET.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error with as [address] is too long', async () => {
		expect.assertions(4);

		const account = Account.create();

		const args: Arguments = {
			address: `${account.address}F`,
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(8000);
			expect(output.args.address).toBe(
				Utils.trimHex(`${account.address}F`)
			);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_GET.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should get account and display in json format', async () => {
		expect.assertions(8);

		const account = Account.create();

		const args: Arguments = {
			address: account.address,
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		const output = await stage(args, session);

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8000);
		expect(output.args.address).toBe(Utils.trimHex(account.address));

		let base = output.display! as BaseAccount;

		expect(base).not.toBe(undefined);
		expect(base.balance).not.toBe(undefined);
		expect(base.nonce).not.toBe(undefined);
		expect(base.bytecode).not.toBe(undefined);
		expect(Utils.cleanAddress(base.address)).toBe(
			Utils.cleanAddress(output.args.address!)
		);
	});

	it('should get account and display in table format', async () => {
		expect.assertions(4);

		const account = Account.create();

		const args: Arguments = {
			address: account.address,
			options: {
				formatted: true,
				host: '127.0.0.1',
				port: 8000
			}
		};

		const output = await stage(args, session);

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8000);
		expect(output.args.address).toBe(Utils.trimHex(account.address));

		let base = output.display!;

		expect(base instanceof ASCIITable).toBe(true);
	});
});
