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
	ADDRESS_EMPTY: '@evmlc/accounts/get/ADDRESS_EMPTY',
	ADDRESS_INVALID_LENGTH: '@evmlc/accounts/get/ADDRESS_INVALID_LENGTH'
};

export const ACCOUNT_UPDATE = {
	// Non-interactive
	ADDRESS_EMPTY: '@evmlc/accounts/update/ADDRESS_EMPTY',
	ADDRESS_INVALID_LENGTH: '@evmlc/accounts/update/ADDRESS_INVALID_LENGTH',

	OLD_PWD_NOT_FOUND: '@evmlc/accounts/update/OLD_PWD_NOT_FOUND',
	OLD_PWD_IS_DIR: '@evmlc/accounts/update/OLD_PWD_IS_DIR',
	OLD_PWD_EMPTY: '@evmlc/accounts/update/OLD_PWD_EMPTY',

	NEW_PWD_NOT_FOUND: '@evmlc/accounts/update/NEW_PWD_NOT_FOUND',
	NEW_PWD_IS_DIR: '@evmlc/accounts/update/NEW_PWD_IS_DIR',
	NEW_PWD_EMPTY: '@evmlc/accounts/update/NEW_PWD_EMPTY',

	SAME_OLD_NEW_PWD: '@evmlc/accounts/update/SAME_OLD_NEW_PWD',

	// Interactive
	PASS_FIELDS_BLANK: '@evmlc/accounts/update/PASS_FIELDS_BLANK',
	PASS_DO_NOT_MATCH: '@evmlc/accounts/update/PASS_DO_NOT_MATCH'
};

export const TRANSFER = {
	FROM_EMPTY: '@evmlc/accounts/transfer/PASS_FIELDS_BLANK',
	TO_VALUE_EMPTY: '@evmlc/accounts/transfer/PASS_FIELDS_BLANK',

	PWD_PATH_EMPTY: '@evmlc/accounts/transfer/PWD_PATH_EMPTY',
	PWD_IS_DIR: '@evmlc/accounts/transfer/PWD_IS_DIR',
	PWD_PATH_NOT_FOUND: '@evmlc/accounts/transfer/PWD_PATH_NOT_FOUND'
};
