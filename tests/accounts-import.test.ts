import { session } from './stage';

import { Arguments, stage, Output } from '../src/cmd/accounts-import';
import { ACCOUNTS_IMPORT } from '../src/errors/accounts';

describe('accounts-import.ts', () => {
	it('should error as [priv_key] is empty', async () => {
		expect.assertions(1);

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_IMPORT.PRIV_KEY_EMPTY);
			}
		}
	});

	it('should error as --pwd path empty', async () => {
		expect.assertions(2);

		const args: Arguments = {
			priv_key:
				'8f9583de109a2c65170db4a0b3ad4' +
				'98f458886122e3ab7ea1f90520390ad0790',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.pwd).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_IMPORT.PWD_PATH_EMPTY);
			}
		}
	});

	it('should error as --pwd path not found', async () => {
		expect.assertions(2);

		const path = '/path_does_not_exist/pwd.txt';

		const args: Arguments = {
			priv_key:
				'8f9583de109a2c65170db4a0b3ad4' +
				'98f458886122e3ab7ea1f90520390ad0790',
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
					ACCOUNTS_IMPORT.PWD_PATH_NOT_FOUND
				);
			}
		}
	});

	it('should error as --pwd path is a directory', async () => {
		expect.assertions(2);

		const path = '/';

		const args: Arguments = {
			priv_key:
				'8f9583de109a2c65170db4a0b3ad4' +
				'98f458886122e3ab7ea1f90520390ad0790',
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
				expect(output.error.type).toBe(ACCOUNTS_IMPORT.PWD_IS_DIR);
			}
		}
	});
});
