import * as Vorpal from 'vorpal';
import Session from './Session';
export declare type CommandFunction = (evmlc: Vorpal, session: Session) => Vorpal.Command;
export default class Globals {
    static evmlcDir: string;
    constructor();
    static success(message: any): void;
    static warning(message: any): void;
    static error(message: any): void;
    static info(message: any): void;
}
