// Accounts Create Errors

export const ACCOUNTS_CREATE = {
	// Non-interactive
	PWD_PATH_EMPTY: '@evmlc/accounts/create/PWD_PATH_EMPTY',
	PWD_IS_DIR: '@evmlc/accounts/create/PWD_IS_DIR',
	PWD_PATH_NOT_FOUND: '@evmlc/accounts/create/PWD_PATH_NOT_FOUND',

	OUT_PATH_IS_NOT_DIR: '@evmlc/accounts/create/OUT_PATH_IS_NOT_DIR',
	OUT_PATH_NOT_FOUND: '@evmlc/accounts/create/OUT_PATH_NOT_FOUND',

	// Interactive
	PASS_FIELDS_BLANK: '@evmlc/accounts/create/PASS_FIELDS_BLANK',
	PASS_DO_NOT_MATCH: '@evmlc/accounts/create/PASS_DO_NOT_MATCH'
};

export const ACCOUNTS_GET = {
	ADDRESS_EMPTY: '@evmlc/accounts/create/ADDRESS_EMPTY',
	ADDRESS_INVALID_LENGTH: '@evmlc/accounts/create/ADDRESS_INVALID_LENGTH'
};
