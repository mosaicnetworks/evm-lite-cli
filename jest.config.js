module.exports = {
	roots: ['<rootDir>/__tests__/'],
	transform: {
		'^.+\\.ts$': 'ts-jest'
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	verbose: true,
	testRegex: '(/__tests__/.*.test|(\\.|/)(test|spec))\\.[jt]sx?$'
};
