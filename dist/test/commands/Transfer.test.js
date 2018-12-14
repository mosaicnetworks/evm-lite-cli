"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chai = require("chai");
const AccountsCreate = require("../../src/commands/AccountsCreate");
const Transfer_1 = require("../../src/commands/Transfer");
const stage_1 = require("../stage");
const Staging_1 = require("../../src/classes/Staging");
const assert = Chai.assert;
let account;
describe('command: transfer', () => {
    it('should return error as connection is not valid', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                host: '127.0.0.1',
                port: 1234
            }
        };
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.INVALID_CONNECTION);
    }));
    it('should return error as no address was provided', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                host: '127.0.0.1',
                port: 8080
            }
        };
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.BLANK_FIELD);
    }));
    it('should return error as address provided does not have a keystore file', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                from: '2a007a8b0f179f4162f3849564948d39b843b188',
                host: '127.0.0.1',
                port: 8080
            }
        };
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.FILE_NOT_FOUND);
    }));
    it('should return error as password file does not exist', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                from: '2a007a8b0f179f4162f3849564948d39b843b188',
                host: '127.0.0.1',
                port: 8080,
                pwd: 'not_here'
            }
        };
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.FILE_NOT_FOUND);
    }));
    it('should error as trying to decrypt with wrong password file', () => __awaiter(this, void 0, void 0, function* () {
        const createArgs = {
            options: {
                pwd: stage_1.pwdPath,
                verbose: true,
            }
        };
        // create account
        const createResult = yield AccountsCreate.stage(createArgs, stage_1.session);
        assert.equal(createResult.type, Staging_1.default.SUCCESS);
        account = createResult.message;
        const args = {
            options: {
                from: account.address,
                host: '127.0.0.1',
                port: 8080,
                pwd: stage_1.otherPwdPath
            }
        };
        // decrypt
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.DECRYPTION);
    }));
    it('should error as trying to transfer with no to or value field', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                from: account.address,
                host: '127.0.0.1',
                port: 8080,
                pwd: stage_1.pwdPath
            }
        };
        const result = yield Transfer_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.BLANK_FIELD);
    }));
});
