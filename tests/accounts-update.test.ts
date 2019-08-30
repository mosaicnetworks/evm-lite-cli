import Utils from 'evm-lite-utils';

import { otherPwdPath, password, pwdPath, session } from './stage';

import { IV3Keyfile } from 'evm-lite-keystore';
import { Arguments, Output, stage } from '../src/cmd/accounts-update';
import { ACCOUNTS_UPDATE } from '../src/errors/accounts';
import { KEYSTORE } from '../src/errors/generals';

describe('accounts-update.ts', () => {
	it('should error as empty keystore', async () => {
		expect.assertions(1);

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.EMPTY);
			}
		}
	});

	it('should error as no [moniker] was provided', async () => {
		expect.assertions(2);

		// create keystore
		await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.moniker).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.MONIKER_EMPTY);
			}
		}
	});

	it('should error as invalid [address] was provided', async () => {
		expect.assertions(1);

		// create keystore
		await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			moniker: 'moniker-123!',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.INVALID_MONIKER);
			}
		}
	});

	it('should error as --old passphrase path empty', async () => {
		expect.assertions(2);

		// create keystore
		await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			moniker: 'danu',
			options: {}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.OLD_PWD_EMPTY);
			}
		}
	});

	it('should error as --old passphrase path cannot be found', async () => {
		expect.assertions(2);

		// create keystore
		await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: '/does_not_exists/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe('/does_not_exists/pwd.txt');

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.OLD_PWD_NOT_FOUND
				);
			}
		}
	});

	it('should error as --old passphrase path is dir', async () => {
		expect.assertions(2);

		// create keystore
		await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe('/');

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.OLD_PWD_IS_DIR);
			}
		}
	});

	it('should error as --old passphrase is incorrect to decrypt', async () => {
		expect.assertions(2);

		// create keystore
		const keystore = await session.datadir.newKeyfile('danu', pwdPath);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: otherPwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(otherPwdPath);

			if (output.error) {
				expect(output.error.type).toBe(KEYSTORE.DECRYPTION);
			}
		}
	});

	it('should error as --new passphrase path empty', async () => {
		expect.assertions(3);

		// create keystore
		await session.datadir.newKeyfile('danu', password);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe(undefined);

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.NEW_PWD_EMPTY);
			}
		}
	});

	it('should error as --new passphrase path cannot be found', async () => {
		expect.assertions(3);

		// create keystore
		await session.datadir.newKeyfile('danu', password);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: pwdPath,
				new: '/does_not_exist/pwd.txt'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe('/does_not_exist/pwd.txt');

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.NEW_PWD_NOT_FOUND
				);
			}
		}
	});

	it('should error as --new passphrase path is dir', async () => {
		expect.assertions(3);

		// create keystore
		await session.datadir.newKeyfile('danu', password);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: pwdPath,
				new: '/'
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe('/');

			if (output.error) {
				expect(output.error.type).toBe(ACCOUNTS_UPDATE.NEW_PWD_IS_DIR);
			}
		}
	});

	it('should error as --new and --old passphrases are the same', async () => {
		expect.assertions(3);

		// create keystore
		await session.datadir.newKeyfile('danu', password);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: pwdPath,
				new: pwdPath
			}
		};

		try {
			await stage(args, session);
		} catch (e) {
			const output = e as Output;

			// implicit check that they are the same
			expect(output.args.options.old).toBe(pwdPath);
			expect(output.args.options.new).toBe(pwdPath);

			if (output.error) {
				expect(output.error.type).toBe(
					ACCOUNTS_UPDATE.SAME_OLD_NEW_PWD
				);
			}
		}
	});

	it('should change password to --new passphrase', async () => {
		expect.assertions(3);

		// create keystore
		const keystore = await session.datadir.newKeyfile('danu', password);

		const args: Arguments = {
			moniker: 'danu',
			options: {
				old: pwdPath,
				new: otherPwdPath
			}
		};

		const output = await stage(args, session);
		const success = output.display! as IV3Keyfile;

		// implicit check that they are the same
		expect(output.args.options.old).toBe(pwdPath);
		expect(output.args.options.new).toBe(otherPwdPath);

		expect(Utils.trimHex(success.address)).toBe(
			Utils.trimHex(keystore.address)
		);
	});
});
