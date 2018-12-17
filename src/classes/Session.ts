import * as path from "path";

import {DataDirectory, EVMLC} from 'evm-lite-lib';
import Globals from "./Globals";


export default class Session {

    public interactive: boolean;
    public logpath: string;

    public directory: DataDirectory;
    public connection: EVMLC;


    constructor(dataDirPath: string) {
        this.interactive = false;
        this.connection = null;

        this.logpath = path.join(dataDirPath, 'logs');

        this.directory = new DataDirectory(dataDirPath);


    }

    get keystore() {
        return this.directory.keystore
    }

    get config() {
        return this.directory.config
    }

    public connect(forcedHost: string, forcedPort: number): Promise<EVMLC> {
        const {data} = this.directory.config;

        const host: string = forcedHost || data.connection.host || '127.0.0.1';
        const port: number = forcedPort || data.connection.port || 8080;
        const node = new EVMLC(host, port, {
            from: data.defaults.from,
            gas: data.defaults.gas,
            gasPrice: data.defaults.gasPrice
        });

        return node.testConnection()
            .then((success: boolean) => {
                if (success) {
                    if (this.connection && this.connection.host === host && this.connection.port === port) {
                        return this.connection
                    }

                    if (!forcedHost && !forcedPort) {
                        this.connection = node;
                    }
                    return node;
                } else {
                    return null;
                }
            })
            .catch(() => {
                Globals.error('Could not connect to node.');
                return null
            })
    };

}