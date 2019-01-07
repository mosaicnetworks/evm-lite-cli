import * as ASCIITable from 'ascii-table';
import { BaseAccount, SentTX, TXReceipt, V3JSONKeyStore } from 'evm-lite-lib';
import Session from './Session';
export interface Args {
    options: {
        [key: string]: any;
    };
    [key: string]: any;
}
export declare type Message = SentTX[] | BaseAccount[] | TXReceipt | V3JSONKeyStore | ASCIITable | object | string;
export interface StagedOutput<Message> {
    type: string;
    subtype?: string;
    args: Args;
    message?: Message;
}
export declare type StagingFunction = (args: Args, session: Session) => Promise<StagedOutput<Message>>;
export default class Staging {
    static ERROR: string;
    static SUCCESS: string;
    static ERRORS: {
        BLANK_FIELD: string;
        DECRYPTION: string;
        DIRECTORY_NOT_EXIST: string;
        FETCH_FAILED: string;
        FILE_NOT_FOUND: string;
        INVALID_CONNECTION: string;
        IS_DIRECTORY: string;
        IS_FILE: string;
        OTHER: string;
        PATH_NOT_EXIST: string;
    };
    constructor();
    static success(args: Args, message: Message): {
        args: Args;
        message: any;
        type: string;
    };
    static error(args: Args, subtype: string, message?: Message): {
        args: Args;
        message: any;
        subtype: string;
        type: string;
    };
    static getStagingFunctions(args: Args): {
        error: (subtype: string, message?: Message) => StagedOutput<Message>;
        success: (message: Message) => StagedOutput<Message>;
    };
}
export declare const execute: (fn: StagingFunction, args: Args, session: Session) => Promise<void>;
