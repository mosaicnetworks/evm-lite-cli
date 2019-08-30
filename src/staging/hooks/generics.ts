import { Args } from 'vorpal';

import { IAbstractConsensus } from 'evm-lite-consensus';

import Session from '../../Session';
import Staging, { IOptions } from '../Staging';

import { INVALID_CONNECTION } from '../../errors/generals';

export interface IGenericHooks {
	connect: (host: string, port: number) => Promise<boolean>;
}

export default function<
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>
): IGenericHooks {
	return {
		connect: connect.bind(null, staging, session)
	};
}

const connect = async <
	TConsensus extends IAbstractConsensus,
	TArguments extends Args<IOptions>,
	TFormatted,
	TNormal = TFormatted
>(
	staging: Staging<TArguments, TFormatted, TNormal>,
	session: Session<TConsensus>,
	host: string,
	port: number
): Promise<boolean> => {
	const { debug, error } = staging.handlers(session.debug);

	const status = await session.connect(host, port);

	debug(`Attempting to connect: ${host}:${port}`);

	if (!status) {
		return Promise.reject(
			error(
				INVALID_CONNECTION,
				`A connection could not be establised to ${host}:${port}`
			)
		);
	}

	return status;
};
