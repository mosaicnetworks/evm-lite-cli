import ASCIITable from 'ascii-table';

import { BaseAccount } from 'evm-lite-core';

import { session } from './stage';

import { Arguments, stage, Output } from '../src/cmd/accounts-list';
import { INVALID_CONNECTION } from '../src/errors/generals';

describe('accounts-list.ts', () => {
	it('should error with as invalid node conn details (remote)', async () => {
		expect.assertions(3);

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
			const output = e as Output;

			expect(output.args.options.host).toBe('127.0.0.1');
			expect(output.args.options.port).toBe(3000);

			if (output.error) {
				expect(output.error.type).toBe(INVALID_CONNECTION);
			}
		}
	});

	it('should list accounts an array non formatted', async () => {
		expect.assertions(4);

		// create keystore
		await session.keystore.create('password');

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8000
			}
		};

		const output = await stage(args, session);
		const success = output.display! as BaseAccount[];

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8000);

		expect(success instanceof Array).toBe(true);
		expect(success.length).toBe(1);
	});

	it('should list accounts a table formatted', async () => {
		expect.assertions(3);

		// create keystore
		await session.keystore.create('password');

		const args: Arguments = {
			options: {
				formatted: true,
				host: '127.0.0.1',
				port: 8000
			}
		};

		const output = await stage(args, session);
		const success = output.display! as BaseAccount[];

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8000);

		expect(success instanceof ASCIITable).toBe(true);
	});
});
