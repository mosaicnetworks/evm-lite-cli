export type MonikerAnnounce = {
	_address: string;
	_moniker: string;
};

export type NomineeProposed = {
	_nominee: string;
	_proposer: string;
};

export type EvictionProposed = {
	_nominee: string;
	_proposer: string;
};

export type NomineeVoteCast = {
	_nominee: string;
	_voter: string;
	_yesVotes: string;
	_noVotes: string;
	_accepted: boolean;
};

export type EvictionVoteCast = {
	_nominee: string;
	_voter: string;
	_yesVotes: string;
	_noVotes: string;
	_accepted: boolean;
};

export type NomineeDecision = {
	_nominee: string;
	_yesVotes: string;
	_noVotes: string;
	_accepted: boolean;
};

export type EvictionDecision = {
	_nominee: string;
	_yesVotes: string;
	_noVotes: string;
	_accepted: boolean;
};
