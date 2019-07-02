import { session, pwdPath, otherPwdPath, password } from './stage';

import { stage, Arguments, Output } from '../src/cmd/transfer';
import { TRANSFER } from '../src/errors/accounts';
import { KEYSTORE, EVM_LITE, INVALID_CONNECTION } from '../src/errors/generals';
import { Utils } from 'evm-lite-core';

describe('transfer.ts', () => {
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

	it('should error as keystore is empty', async () => {
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
				expect(output.error.type).toBe(KEYSTORE.EMPTY);
			}
		}
	});

	it('should error as `from` address not provided', async () => {
		expect.assertions(3);

		// create keystore
		await session.keystore.create(password);

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
				expect(output.error.type).toBe(TRANSFER.FROM_EMPTY);
			}
		}
	});

	it('should error as `from` address keystore cannot be located', async () => {
		expect.assertions(4);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				from: `${from.address.slice(1)}F`,
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
			expect(Utils.trimHex(output.args.options.from!)).toBe(
				Utils.trimHex(`${from.address.slice(1)}F`)
			);

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.FETCH);
			}
		}
	});

	it('should error as --pwd passphrase path empty', async () => {
		expect.assertions(3);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				from: from.address,
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
				expect(output.error.type).toBe(TRANSFER.PWD_PATH_EMPTY);
			}
		}
	});

	it('should error as --pwd passphrase path does not exist', async () => {
		expect.assertions(3);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				pwd: '/does_not_exist/pwd.txt',
				from: from.address,
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
				expect(output.error.type).toBe(TRANSFER.PWD_PATH_NOT_FOUND);
			}
		}
	});

	it('should error as --pwd passphrase path is dir', async () => {
		expect.assertions(3);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				pwd: '/',
				from: from.address,
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
				expect(output.error.type).toBe(TRANSFER.PWD_IS_DIR);
			}
		}
	});

	it('should error as --pwd passphrase cannot decrypt keystore', async () => {
		expect.assertions(3);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				pwd: otherPwdPath,
				from: from.address,
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
				expect(output.error.type).toBe(KEYSTORE.DECRYPTION);
			}
		}
	});

	it('should error as --to, --value are empty', async () => {
		expect.assertions(3);

		// create keystore
		const from = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				pwd: pwdPath,
				from: from.address,
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
				expect(output.error.type).toBe(TRANSFER.TO_VALUE_EMPTY);
			}
		}
	});
});
