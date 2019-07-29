import { Args } from 'vorpal';

import Frames, { IOptions } from './Frames';

import { INVALID_CONNECTION } from '../errors/generals';

export interface IGenericFrames {
	connect: (host: string, port: number) => Promise<boolean>;
}

export default <A extends Args<IOptions>, F, N>(
	frame: Frames<A, F, N>
): IGenericFrames => {
	return {
		connect: connect.bind(null, frame)
	};
};

const connect = async <A extends Args<IOptions>, F, N>(
	frames: Frames<A, F, N>,
	host: string,
	port: number
): Promise<boolean> => {
	const { debug, error } = frames.staging();
	const status = await frames.session.connect(host, port);

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
