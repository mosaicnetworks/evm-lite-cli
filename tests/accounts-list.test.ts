import ASCIITable from 'ascii-table';

import { BaseAccount } from 'evm-lite-core';

import { Arguments, stage } from '../src/cmd/accounts-list';
import { InvalidConnection } from '../src/errors';

import { session } from './stage';

describe('accounts-list.ts', () => {
	it('should throw InvalidConnection (no arguments)', async () => {
		const args: Arguments = {
			options: {
				remote: true,
				host: '127.0.0.1',
				port: 3000
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidConnection).toBe(true);
		}
	});

	it('should list accounts formatted', async () => {
		const args: Arguments = {
			options: {
				formatted: true,
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);

		expect(output.display instanceof ASCIITable).toBe(true);
	});

	it('should list accounts non-formatted', async () => {
		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);

		expect(output.display instanceof Array).toBe(true);

		const accounts = output.display! as BaseAccount[];

		if (accounts.length) {
			const account = accounts[0];

			expect(account.address).not.toBe(undefined);
			expect(account.balance).not.toBe(undefined);
			expect(account.nonce).not.toBe(undefined);
			expect(account.bytecode).not.toBe(undefined);
		}
	});
});
