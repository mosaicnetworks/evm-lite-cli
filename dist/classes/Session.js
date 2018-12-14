"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const evm_lite_lib_1 = require("evm-lite-lib");
class Session {
    constructor(dataDirPath) {
        this.interactive = false;
        this.connection = null;
        this.logs = [];
        this.logpath = path.join(dataDirPath, 'logs');
        this.directory = new evm_lite_lib_1.DataDirectory(dataDirPath);
        this.database = new evm_lite_lib_1.Database(path.join(dataDirPath, 'db.json'));
        this.config = this.directory.config;
        this.keystore = this.directory.keystore;
    }
    connect(forcedHost, forcedPort) {
        const host = forcedHost || this.config.data.defaults.host || '127.0.0.1';
        const port = forcedPort || this.config.data.defaults.port || 8080;
        const node = new evm_lite_lib_1.EVMLC(host, port, {
            from: '',
            gas: 0,
            gasPrice: 0
        });
        return node.testConnection()
            .then((success) => {
            if (success) {
                if (this.connection && this.connection.host === host && this.connection.port === port) {
                    return this.connection;
                }
                if (!forcedHost && !forcedPort) {
                    this.connection = node;
                }
                return node;
            }
            else {
                return null;
            }
        });
    }
    ;
    log() {
        const log = new evm_lite_lib_1.Log(this.logpath);
        this.logs.push(log);
        return log;
    }
}
exports.default = Session;
