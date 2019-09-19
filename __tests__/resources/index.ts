import * as fs from 'fs';
import * as path from 'path';

import Session from '../../src/core/Session';

export const session = new Session('./__tests__/resources/datadir/', 'evmlc');

const directory = path.resolve(__dirname, './datadir/keystore');

afterEach(() => {
	fs.readdir(directory, (err, files) => {
		if (err) {
			throw err;
		}

		for (const file of files) {
			fs.unlink(path.join(directory, file), e => {
				if (e) {
					throw e;
				}
			});
		}
	});
});
