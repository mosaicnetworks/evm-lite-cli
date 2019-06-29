export class PathNotFoundError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

export class InvalidPathError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

export class ArgumentNotProvidedError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

export class InvalidArgumentError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

export class InvalidConnectionError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

// Keystore
export class EmptyKeystoreDirectoryError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

export class KeystoreNotFoundError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}

// Receipt
export class EmptyTransactionReceiptLogsError extends Error {
	constructor(message: string) {
		super(message);

		this.name = this.constructor.name;
	}
}
