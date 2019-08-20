import { pwdPath, session } from './stage';

import { Arguments, Output, stage } from '../src/cmd/accounts-create';
import { ACCOUNTS_CREATE } from '../src/errors/accounts';

describe('accounts-create.ts', () => {
	it('should error as [moniker] is empty', async () => {
		expect.assertions(1);

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_CREATE.EMPTY_MONIKER);
			}
		}
	});

	it('should error as moniker provided has wrong format', async () => {
		expect.assertions(1);

		const args: Arguments = {
			moniker: 'danu-123!',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_CREATE.INVALID_MONIKER);
			}
		}
	});

	it('should error as --pwd path not found', async () => {
		expect.assertions(2);

		const path = '/path_does_not_exist/pwd.txt';

		const args: Arguments = {
			moniker: 'danu',
			options: {
				pwd: path
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.pwd).toBe(path);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_CREATE.PWD_PATH_NOT_FOUND
				);
			}
		}
	});

	it('should error as --pwd path is a directory', async () => {
		expect.assertions(2);

		const path = '/';

		const args: Arguments = {
			moniker: 'danu',
			options: {
				pwd: path
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.pwd).toBe(path);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_CREATE.PWD_IS_DIR);
			}
		}
	});

	it('should error as --out path not found', async () => {
		expect.assertions(2);

		const path = '/does_not_exist/';

		const args: Arguments = {
			moniker: 'danu',
			options: {
				pwd: pwdPath,
				out: path
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.out).toBe(path);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_CREATE.OUT_PATH_NOT_FOUND
				);
			}
		}
	});

	it('should error as --out path is not a directory', async () => {
		expect.assertions(2);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				pwd: pwdPath,
				out: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.out).toBe(pwdPath);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_CREATE.OUT_PATH_IS_NOT_DIR
				);
			}
		}
	});

	it('should create account with --pwd and --out paths provided', async () => {
		expect.assertions(4);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				pwd: pwdPath,
				out: session.datadir.keystorePath
			}
		};

		const output = await stage(args, session);

		expect(output.args.options.out).toBe(session.datadir.keystorePath);
		expect(output.args.options.pwd).toBe(pwdPath);

		expect(output.display).not.toBe(undefined);
		expect(output.display!.address).not.toBe(undefined);
	});
});
