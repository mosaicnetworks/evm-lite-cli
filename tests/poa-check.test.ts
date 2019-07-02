import { session } from './stage';

import { stage, Arguments, Output } from '../src/cmd/poa-check';
import { POA_CHECK } from '../src/errors/poa';
import { INVALID_CONNECTION } from '../src/errors/generals';
import { Account } from 'evm-lite-core';

describe('poa-check.ts', () => {
	it('should error as invalid node conn details', async () => {
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

	it('should error as [address] is empty', async () => {
		expect.assertions(3);

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

			if (output.error) {
				expect(output.error.type).toBe(POA_CHECK.ADDRESS_EMPTY);
			}
		}
	});

	it('should error as [address] is too long', async () => {
		expect.assertions(3);

		const account = Account.create();

		const args: Arguments = {
			address: account.address + 'A',
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

			if (output.error) {
				expect(output.error.type).toBe(
					POA_CHECK.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});

	it('should error as [address] is too short', async () => {
		expect.assertions(3);

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

			if (output.error) {
				expect(output.error.type).toBe(
					POA_CHECK.ADDRESS_INVALID_LENGTH
				);
			}
		}
	});
});
