"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const evm_lite_lib_1 = require("evm-lite-lib");
const Globals_1 = require("./Globals");
class Session {
    constructor(dataDirPath) {
        this.interactive = false;
        this.connection = null;
        this.logpath = path.join(dataDirPath, 'logs');
        this.directory = new evm_lite_lib_1.DataDirectory(dataDirPath);
    }
    get database() {
        return this.directory.database;
    }
    get keystore() {
        return this.directory.keystore;
    }
    get config() {
        return this.directory.config;
    }
    connect(forcedHost, forcedPort) {
        const { data } = this.directory.config;
        const host = forcedHost || data.connection.host || '127.0.0.1';
        const port = forcedPort || data.connection.port || 8080;
        const node = new evm_lite_lib_1.EVMLC(host, port, {
            from: data.defaults.from,
            gas: data.defaults.gas,
            gasPrice: data.defaults.gasPrice
        });
        return node
            .testConnection()
            .then((success) => {
            if (success) {
                if (this.connection &&
                    this.connection.host === host &&
                    this.connection.port === port) {
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
        })
            .catch(() => {
            Globals_1.default.error('Could not connect to node.');
            return null;
        });
    }
}
exports.default = Session;
