import ASCIITable from 'ascii-table';

import { IBaseAccount } from 'evm-lite-client';

import { session } from './stage';

import { Arguments, stage } from '../src/cmd/accounts-list';

describe('accounts-list.ts', () => {
	it('should list accounts an array non formatted', async () => {
		expect.assertions(4);

		// create keystore
		await session.datadir.newKeyfile('danu', 'password');

		const args: Arguments = {
			options: {
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);
		const success = output.display! as IBaseAccount[];

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8080);

		expect(success instanceof Array).toBe(true);
		expect(success.length).toBe(1);
	});

	it('should list accounts a table formatted', async () => {
		expect.assertions(3);

		// create keystore
		await session.datadir.newKeyfile('danu2', 'password');

		const args: Arguments = {
			options: {
				formatted: true,
				host: '127.0.0.1',
				port: 8080
			}
		};

		const output = await stage(args, session);
		const success = output.display! as IBaseAccount[];

		expect(output.args.options.host).toBe('127.0.0.1');
		expect(output.args.options.port).toBe(8080);

		expect(success instanceof ASCIITable).toBe(true);
	});
});
