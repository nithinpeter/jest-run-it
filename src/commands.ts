import * as vscode from 'vscode';

import {
  DEFAULT_JEST_PATH,
  DEFAULT_JEST_DEBUG_PATH_WINDOWS,
  TERMINAL_NAME,
} from './constants';
import { getConfig, ConfigOption } from './config';
import { quoteTestName, getTerminal, quoteArgument } from './extension';

const convertEnvVariablesToObj = (env: string) => {
  const obj = (env.split(' ') as string[])
    .filter((v: string) => !!v)
    .reduce((acc, v) => {
      const [key, val] = v.split('=');
      acc[key] = val;
      return acc;
    }, {} as { [key: string]: string });

  return obj;
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
  const environmentVarialbes = getConfig(
    ConfigOption.EnvironmentVariables
  ) as string;
  const args = [quoteTestName(filePath)];
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
    env: convertEnvVariablesToObj(environmentVarialbes),
  };
  vscode.debug.startDebugging(
    vscode.workspace.getWorkspaceFolder(editor!.document.uri),
    debugConfig
  );
};
