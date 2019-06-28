import { Arguments, stage } from '../src/cmd/accounts-create';
import {
	InvalidArgumentError,
	InvalidPathError,
	PathNotFoundError
} from '../src/errors';

import { session, pwdPath } from './stage';

describe('accounts-create.ts', () => {
	it('should throw InvalidArgumentError (no arguments)', async () => {
		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (invalid `pwd` path)', async () => {
		const args: Arguments = {
			options: {
				pwd: '/does_not_exists/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (invalid `pwd` path)', async () => {
		const args: Arguments = {
			options: {
				pwd: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidPathError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (invalid `out` path)', async () => {
		const args: Arguments = {
			options: {
				pwd: pwdPath,
				out: '/does_not_exists'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (invalid `out` path)', async () => {
		const args: Arguments = {
			options: {
				pwd: pwdPath,
				out: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidPathError).toBe(true);
		}
	});

	it('should create an encrypted account', async () => {
		const args: Arguments = {
			options: {
				pwd: pwdPath,
				out: session.keystore.path
			}
		};

		const { display: keystore } = await stage(args, session);

		expect(keystore).not.toBe(undefined);

		expect(typeof keystore!).toBe('object');
		expect(keystore!.address.length).toBe(40);
		expect(keystore!.version).toBe(3);
	});
});
