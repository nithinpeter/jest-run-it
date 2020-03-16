import * as vscode from 'vscode';

import {
  TestsExplorerDataProvider,
  Testable,
} from './testsExplorerDataProvider';
import { DEFAULT_TEST_FILE_PATTERNS } from './constants';
import { getConfig, ConfigOption } from './config';
import { JestDoItCodeLensProvider } from './jestDoItCodeLensProvider';
import { runTest, debugTest } from './commands';

export const quoteTestName = (testName: string) => {
  // escape double quotes
  const escaped = testName.replace(/'/g, "\\'");
  return `'${escaped}'`;
};

export const getTerminal = (terminalName: string) => {
  return vscode.window.terminals.find(t => t.name === terminalName);
};

const runTestFromExplorer = (testable: Testable) => {
  runTest(testable.file, testable.label);
};

const debugTestFromExplorer = (testable: Testable) => {
  debugTest(testable.file, testable.label);
};

const runTestFromEditor = (uri: vscode.Uri) => {
  const filePath = uri.fsPath;
  runTest(filePath);
};

const debugTestFromEditor = (uri: vscode.Uri) => {
  const filePath = uri.fsPath;
  debugTest(filePath);
};

export const activate = (context: vscode.ExtensionContext) => {
  const testsExplorerDataProvider = new TestsExplorerDataProvider();
  vscode.window.registerTreeDataProvider(
    'jestRunItTestsExplorer',
    testsExplorerDataProvider
  );

  const runTestCommand = vscode.commands.registerCommand(
    'jestRunItCodeLens.runTest',
    runTest
  );
  context.subscriptions.push(runTestCommand);

  const debugTestCommand = vscode.commands.registerCommand(
    'jestRunItCodeLens.debugTest',
    debugTest
  );
  context.subscriptions.push(debugTestCommand);

  const updateSnapshotFromExplorerCommand = vscode.commands.registerCommand(
    'jestRunItCodeLens.updateSnapshots',
    (filePath: string, testName?: string) => runTest(filePath, testName, /*updateSnapshots*/true)
  );
  context.subscriptions.push(updateSnapshotFromExplorerCommand);

  const runTestFromExplorerCommand = vscode.commands.registerCommand(
    'jestRunItTestsExplorer.runTest',
    runTestFromExplorer
  );
  context.subscriptions.push(runTestFromExplorerCommand);

  const debugTestFromExplorerCommand = vscode.commands.registerCommand(
    'jestRunItTestsExplorer.debugTest',
    debugTestFromExplorer
  );
  context.subscriptions.push(debugTestFromExplorerCommand);

  const runTestFromEditorCommand = vscode.commands.registerCommand(
    'jestRunItTestsEditor.runTest',
    runTestFromEditor
  );
  context.subscriptions.push(runTestFromEditorCommand);

  const debugTestFromEditorCommand = vscode.commands.registerCommand(
    'jestRunItTestsEditor.debugTest',
    debugTestFromEditor
  );
  context.subscriptions.push(debugTestFromEditorCommand);

  let patterns = [];
  const testMatchPatternsConfig = getConfig(
    ConfigOption.TestMatchPatterns
  ) as Array<string>;
  if (Array.isArray(testMatchPatternsConfig)) {
    patterns = testMatchPatternsConfig.map(tm => ({
      pattern: tm,
      scheme: 'file',
    }));
  } else {
    // Default patterns
    patterns = DEFAULT_TEST_FILE_PATTERNS.map(tm => ({
      pattern: tm,
      scheme: 'file',
    }));
  }

  const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    patterns,
    new JestDoItCodeLensProvider()
  );
  context.subscriptions.push(codeLensProviderDisposable);
};

// this method is called when your extension is deactivated
export function deactivate() {}
