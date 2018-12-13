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
const ASCIITable = require("ascii-table");
const Chai = require("chai");
const AccountsList_1 = require("../../src/commands/AccountsList");
const stage_1 = require("../stage");
const Staging_1 = require("../../src/classes/Staging");
const assert = Chai.assert;
describe('command: accounts list', () => {
    it('should return error as verbose requires a valid connection to a node', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                host: '127.0.0.1',
                port: '1234',
                verbose: true,
            }
        };
        const result = yield AccountsList_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.ERROR);
        assert.equal(result.subtype, Staging_1.default.ERRORS.INVALID_CONNECTION);
    }));
    it('should return ASCIITable with verbose and formatted with valid connection', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                formatted: true,
                host: '127.0.0.1',
                port: '8080',
                verbose: true,
            }
        };
        const result = yield AccountsList_1.stage(args, stage_1.session);
        console.log(result);
        assert.equal(result.type, Staging_1.default.SUCCESS);
        assert.equal(result.message instanceof ASCIITable, true);
    }));
    it('should return list of BaseAccounts even without a valid connection', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                host: '127.0.0.1',
                port: '1234',
            }
        };
        const result = yield AccountsList_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.SUCCESS);
        assert.equal(result.message instanceof Array, true);
    }));
    it('should return ASCIITable even without a valid connection', () => __awaiter(this, void 0, void 0, function* () {
        const args = {
            options: {
                formatted: true,
                host: '127.0.0.1',
                port: '1234',
            }
        };
        const result = yield AccountsList_1.stage(args, stage_1.session);
        assert.equal(result.type, Staging_1.default.SUCCESS);
        assert.equal(result.message instanceof ASCIITable, true);
    }));
});
