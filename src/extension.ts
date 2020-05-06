import * as vscode from 'vscode';

import {
  TestsExplorerDataProvider,
  Testable,
} from './testsExplorerDataProvider';
import { DEFAULT_TEST_FILE_PATTERNS } from './constants';
import { getConfig, ConfigOption } from './config';
import { JestDoItCodeLensProvider } from './jestDoItCodeLensProvider';
import { runTest, debugTest } from './commands';
import { ArgumentQuotesMode } from './types';

export const quoteArgument = (argumentToQuote: string, quotesToUse?: ArgumentQuotesMode): string => {
    // Decide which quotes to use
    if (quotesToUse === undefined) {
        quotesToUse = (getConfig(ConfigOption.ArgumentQuotesToUse) as ArgumentQuotesMode) || 'auto';
    }
    if (quotesToUse === 'auto') {
        // Note: maybe we should not quote argument if it does not contain spaces?
        quotesToUse = process.platform === 'win32' ? 'double' : 'single';
    }

    switch (quotesToUse) {
        case 'double':
            return `"${argumentToQuote.replace(/"/g, '\\"')}"`;
        case 'single':
            return `'${argumentToQuote.replace(/'/g, '\\\'')}'`;
        default:
            return argumentToQuote;
    }
};

export const quoteTestName = (testName: string, quotesToUse?: ArgumentQuotesMode) => {
    // We pass test name exactly as it typed in the source code, but jest expects a regex pattern to match.
    // We must escape characters having a special meaning in regex, otherwise jest will not match the test.
    // For example, jest -t 'My test (snapshot)' will simply not match corresponding test (because of parens).
    // The correct command would be jest -t 'My test \(snapshot\)'
    const escapedTestName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return quoteArgument(escapedTestName, quotesToUse);
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
