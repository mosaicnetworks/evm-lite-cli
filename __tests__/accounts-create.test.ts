import { AccountCreate } from '../src/commands/accounts-create';

import { session } from './resources/';

describe('accounts create', () => {
	it('should throw moniker not found error', async () => {
		const cmd = new AccountCreate(session, {
			moniker: '',
			options: {
				out: session.datadir.keystorePath,
				silent: false
			}
		});

		try {
			await cmd.check();
		} catch (e) {
			expect(e.message).toBe('Moniker cannot be empty');
		}
	});
});
