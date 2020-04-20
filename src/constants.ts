import {getDefaultJestPathForOS} from './helper';

export const DEFAULT_TEST_FILE_PATTERNS = [
  '**/*.{test,spec}.{js,jsx,ts,tsx}',
  '**/__tests__/*.{js,jsx,ts,tsx}',
];

const DEFAULT_OS_JEST_PATH: { [os: string]: string } = {
  LINUX: 'node_modules/.bin/jest',
  MAC: 'node_modules/.bin/jest',
  /**
   * Issue #8
   *
   * Solution from Stack Overflow
   * @see https://stackoverflow.com/questions/3903288/run-an-exe-from-a-different-directory/3903300#3903300 Stack Overflow
   */
  WINDOWS:'\"node_modules/.bin/jest\"'
};

export const DEFAULT_JEST_PATH = getDefaultJestPathForOS(DEFAULT_OS_JEST_PATH);

export const TERMINAL_NAME = 'JestRunIt';
