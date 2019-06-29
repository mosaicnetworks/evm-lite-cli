import { stage, Arguments } from '../src/cmd/transfer';
import {
	InvalidConnection,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError,
	KeystoreNotFoundError,
	PathNotFoundError,
	InvalidPathError
} from '../src/errors';

import {
	session,
	clearKeystore,
	pwdPath,
	password,
	otherPwdPath
} from './stage';

describe('transfer.ts', () => {
	it('should throw InvalidConnetionError', async () => {
		const args: Arguments = {
			options: {
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

	it('should throw EmptyKeystoreDirectoryError', async () => {
		clearKeystore();

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof EmptyKeystoreDirectoryError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no `from` address)', async () => {
		const _ = await session.keystore.create('password');

		const args: Arguments = {
			options: {
				from: ''
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (incorrect `from` address)', async () => {
		const keystore = await session.keystore.create('password');

		const args: Arguments = {
			options: {
				from: keystore.address.slice(1) + '0'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof KeystoreNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no `pwd` path)', async () => {
		const keystore = await session.keystore.create('password');

		const args: Arguments = {
			options: {
				from: keystore.address
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (invalid `pwd` path)', async () => {
		const keystore = await session.keystore.create('password');

		const args: Arguments = {
			options: {
				from: keystore.address,
				pwd: '/does_not_exists/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (`pwd` path is directory)', async () => {
		const keystore = await session.keystore.create('password');

		const args: Arguments = {
			options: {
				from: keystore.address,
				pwd: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidPathError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (decryption fails)', async () => {
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				from: keystore.address,
				pwd: otherPwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no `to`, `value` set)', async () => {
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			options: {
				from: keystore.address,
				pwd: pwdPath,
				to: '',
				value: 0
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});
});
