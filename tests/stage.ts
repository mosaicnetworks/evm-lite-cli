import * as path from 'path';
import * as fs from 'fs';

import Session from '../src/Session';

export const datadir: string = path.join(__dirname, 'assets');
export const session: Session = new Session(datadir);

export const pwdPath = path.join(datadir, 'pwd.txt');
export const password = fs.readFileSync(pwdPath, 'utf8').trim();

export const otherPwdPath = path.join(datadir, 'other_pwd.txt');
export const otherPassword = fs.readFileSync(pwdPath, 'utf8').trim();

export const clearKeystore = () => {
	const keystore = path.join(datadir, 'keystore');
	const files = fs.readdirSync(keystore).filter(file => {
		return !file.startsWith('.');
	});

	files.forEach(file => {
		fs.unlinkSync(path.join(keystore, file));
	});
};

beforeEach((): void => clearKeystore());
