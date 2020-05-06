import * as vscode from 'vscode';

import { DEFAULT_JEST_PATH, TERMINAL_NAME } from './constants';
import { getConfig, ConfigOption } from './config';
import { quoteTestName, getTerminal, quoteArgument } from './extension';

export const runTest = (filePath: string, testName?: string, updateSnapshots = false) => {
  const jestPath = getConfig(ConfigOption.JestPath) || DEFAULT_JEST_PATH;
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);
  let command = `${jestPath} ${quoteArgument(filePath)}`;
  if (testName) {
    command += ` -t ${quoteTestName(testName)}`;
  }
  if (jestConfigPath) {
    command += ` -c ${jestConfigPath}`;
  }
  if (updateSnapshots) {
    command += ' -u';
  }
  let terminal = getTerminal(TERMINAL_NAME);
  if (!terminal) {
    terminal = vscode.window.createTerminal(TERMINAL_NAME);
  }
  terminal.show();
  terminal.sendText(command);
};
export const debugTest = (filePath: string, testName?: string) => {
  const editor = vscode.window.activeTextEditor;
  const jestPath = getConfig(ConfigOption.JestPath) || DEFAULT_JEST_PATH;
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);
  const args = [filePath];
  if (testName) {
    args.push('-t', quoteArgument(testName));
  }
  if (jestConfigPath) {
    args.push('-c', jestConfigPath as string);
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
  };
  vscode.debug.startDebugging(
    vscode.workspace.getWorkspaceFolder(editor!.document.uri),
    debugConfig
  );
};
