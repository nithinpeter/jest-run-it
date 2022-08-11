import * as vscode from 'vscode';

import {
  DEFAULT_JEST_PATH,
  DEFAULT_JEST_DEBUG_PATH_WINDOWS,
  TERMINAL_NAME,
} from './constants';
import { getConfig, ConfigOption } from './config';
import { quoteTestName, getTerminal, quoteArgument } from './extension';

const convertEnvVariablesToObj = (env: string) => {
  const variables: Record<string, string> = {}

  let varKey = ''
  let tempStr = ''
  let inQuote = false
  for (const char of env) {
    // if we are in a quote, we need to keep track of the key
    if (char === '\"') {
      inQuote = !inQuote
      continue
    }

    // set tempStr to varKey when matching a '='
    if (char === '=') {
      varKey = tempStr
      tempStr = ''
      continue
    }

    if (char === ' ') {
      // only keys, like: '--xxx'
      if (!varKey && tempStr) {
        variables[tempStr] = ''
        tempStr = ''
        continue
      }

      // handle key=value, like: '--xxx=yyy'
      if (!inQuote && varKey) {
        variables[varKey] = variables[varKey] ? `${variables[varKey]} ${tempStr}` : tempStr
        varKey = ''
        tempStr = ''
        continue
      }

      // if tempStr is empty, do not keep space
      if (!tempStr) {
        continue
      }
    }

    tempStr += char
  }

  // fallback characters
  if (!varKey) {
    variables[tempStr] = ''
  } else {
    variables[varKey] = variables[varKey] ? `${variables[varKey]} ${tempStr}` : tempStr
  }

  return variables;
};

export const runTest = (
  filePath: string,
  testName?: string,
  updateSnapshots = false
) => {
  const jestPath = getConfig(ConfigOption.JestPath) || DEFAULT_JEST_PATH;
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);
  const runOptions = getConfig(ConfigOption.JestCLIOptions) as string[];
  const environmentVarialbes = getConfig(
    ConfigOption.EnvironmentVariables
  ) as string;

  let command = `${environmentVarialbes} ${jestPath} ${quoteTestName(filePath)}`;

  if (testName) {
    command += ` -t ${quoteTestName(testName)}`;
  }
  if (jestConfigPath) {
    command += ` -c ${jestConfigPath}`;
  }
  if (updateSnapshots) {
    command += ' -u';
  }
  if (runOptions) {
    runOptions.forEach((option) => {
      command += ` ${option}`;
    });
  }
  let terminal = getTerminal(TERMINAL_NAME);
  if (!terminal) {
    terminal = vscode.window.createTerminal(TERMINAL_NAME);
  }
  terminal.show();
  terminal.sendText(command.trim());
};
export const debugTest = (filePath: string, testName?: string) => {
  const editor = vscode.window.activeTextEditor;
  const jestPath =
    getConfig(ConfigOption.JestPath) ||
    (process.platform === 'win32'
      ? DEFAULT_JEST_DEBUG_PATH_WINDOWS
      : DEFAULT_JEST_PATH);
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);
  const jestCLIOptions = getConfig(ConfigOption.JestCLIOptions) as string[];
  const environmentVariables = getConfig(
    ConfigOption.EnvironmentVariables
  ) as string;
  const args = [filePath];
  if (testName) {
    args.push('-t', quoteTestName(testName, 'none'));
  }
  if (jestConfigPath) {
    args.push('-c', jestConfigPath as string);
  }
  if (jestCLIOptions) {
    jestCLIOptions.forEach((option) => {
      args.push(option);
    });
  }
  args.push('--runInBand');
  const debugConfig: vscode.DebugConfiguration = {
    console: 'integratedTerminal',
    internalConsoleOptions: 'neverOpen',
    name: 'JestRunIt',
    program: '${workspaceFolder}/' + jestPath,
    request: 'launch',
    type: 'node',
    args,
    env: convertEnvVariablesToObj(environmentVariables),
  };
  vscode.debug.startDebugging(
    vscode.workspace.getWorkspaceFolder(editor!.document.uri),
    debugConfig
  );
};
