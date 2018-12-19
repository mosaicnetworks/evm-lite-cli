"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Session_1 = require("../src/classes/Session");
exports.datadir = path.join(__dirname, './assets');
exports.session = new Session_1.default(exports.datadir);
exports.pwdPath = path.join(exports.datadir, 'pwd.txt');
exports.password = fs.readFileSync(exports.pwdPath, 'utf8').trim();
exports.otherPwdPath = path.join(exports.datadir, 'other_pwd.txt');
exports.otherPassword = fs.readFileSync(exports.pwdPath, 'utf8').trim();
after(() => {
    const keystore = path.join(exports.datadir, 'keystore');
    const files = fs.readdirSync(keystore).filter((file) => {
        return !(file.startsWith('.'));
    });
    files.forEach((file) => {
        fs.unlinkSync(path.join(keystore, file));
    });
});
