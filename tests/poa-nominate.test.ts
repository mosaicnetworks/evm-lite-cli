import { Account } from 'evm-lite-core';

import { stage, Arguments } from '../src/cmd/poa-nominate';
import {
	InvalidConnectionError,
	EmptyKeystoreDirectoryError,
	InvalidArgumentError,
	InvalidPathError,
	PathNotFoundError,
	KeystoreNotFoundError
} from '../src/errors';

import {
	session,
	clearKeystore,
	password,
	pwdPath,
	otherPwdPath
} from './stage';

describe('poa-nominate.ts', () => {
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
			expect(e instanceof InvalidConnectionError).toBe(true);
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

	it('should throw InvalidArgumentError (no address set)', async () => {
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: '',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no address set)', async () => {
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: '',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) long from address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			options: {
				from: keystore.address + '0' // 43
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) short from address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			options: {
				from: `0x${keystore.address.slice(3)}` // 41
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) long from address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			options: {
				from: keystore.address.slice(2) + '0' // 41
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) short from address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			options: {
				from: `${keystore.address.slice(3)}` // 39
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((mul 0x) long from address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			options: {
				from: `0x0x${keystore.address.slice(4)}` // 42
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no moniker)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				moniker: ''
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no from address)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				moniker: 'danu',
				from: ''
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (no pwd path)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				moniker: 'danu',
				from: keystore.address,
				pwd: ''
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (wrong pwd path)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				moniker: 'danu',
				from: keystore.address,
				pwd: '/does_not_exists'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (pwd path is directory)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				moniker: 'danu',
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

	it('should throw KeystoreNotFoundError (wrong address)', async () => {
		// Create account
		const account = Account.create();

		const args: Arguments = {
			address: account.address.slice(3) + '3', // 40
			options: {
				moniker: 'danu',
				pwd: otherPwdPath,
				from: account.address
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof KeystoreNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (wrong passphrase)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				pwd: otherPwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});
});
