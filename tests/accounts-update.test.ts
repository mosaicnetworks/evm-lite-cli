import { Account } from 'evm-lite-core';

import { Arguments, stage } from '../src/cmd/accounts-update';
import {
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
import { V3JSONKeyStore } from 'evm-lite-keystore';

let keystore: V3JSONKeyStore;

describe('accounts-update.ts', () => {
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

	it('should throw InvalidArgumentError (empty address)', async () => {
		// So one account exists
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

	it('should throw InvalidArgumentError ((inc 0x) long address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: keystore.address + '0', // 43
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) short address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `0x${keystore.address.slice(3)}`, // 41
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((ex 0x) long address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: keystore.address.slice(2) + '0', // 41
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((inc 0x) short address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `${keystore.address.slice(3)}`, // 39
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError ((mul 0x) address)', async () => {
		// Create account
		const keystore = await session.keystore.create('danu');

		const args: Arguments = {
			address: `0x0x${keystore.address.slice(4)}`, // 42
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should throw KeystoreNotFoundError (wrong address)', async () => {
		// Create account
		const account = Account.create();

		const args: Arguments = {
			address: account.address.slice(3) + '3', // 40
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof KeystoreNotFoundError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (wrong old pwd path)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: '/does_not_exists'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (old pwd path is directory)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidPathError).toBe(true);
		}
	});

	it('should throw PathNotFoundError (wrong new pwd path)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: pwdPath,
				new: '/does_not_exist'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof PathNotFoundError).toBe(true);
		}
	});

	it('should throw InvalidPathError (old pwd path is directory)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: pwdPath,
				new: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidPathError).toBe(true);
		}
	});

	it('should throw InvalidArgumentError (old = new)', async () => {
		// Create account
		const keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: pwdPath,
				new: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			expect(e instanceof InvalidArgumentError).toBe(true);
		}
	});

	it('should update passsword for keystore to new pass)', async () => {
		keystore = await session.keystore.create(password);

		const args: Arguments = {
			address: keystore.address, // 40
			options: {
				old: pwdPath,
				new: otherPwdPath
			}
		};

		const { display } = await stage(args, session);

		expect(display).not.toBe(undefined);

		expect(typeof display!).toBe('object');
		expect(display!.address.length).toBe(40);
		expect(display!.address).toBe(keystore.address);
		expect(display!.version).toBe(3);
	});

	it('should update passsword for keystore back to old pass)', async () => {
		const args: Arguments = {
			address: keystore.address,
			options: {
				old: otherPwdPath,
				new: pwdPath
			}
		};

		const { display } = await stage(args, session);

		expect(display).not.toBe(undefined);

		expect(typeof display!).toBe('object');
		expect(display!.address.length).toBe(40);
		expect(display!.address).toBe(keystore.address);
		expect(display!.version).toBe(3);
	});
});
