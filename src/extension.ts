import * as vscode from 'vscode';
import { parse } from 'jest-editor-support';

import {
  TestsExplorerDataProvider,
  Testable,
} from './testsExplorerDataProvider';
import {
  DEFAULT_TEST_FILE_PATTERNS,
  DEFAULT_JEST_PATH,
  TERMINAL_NAME,
} from './constants';
import { getConfig, ConfigOption } from './config';

const quoteTestName = (testName: string) => {
  // escape double quotes
  const escaped = testName.replace(/'/g, "\\'");
  return `'${escaped}'`;
};

const getTerminal = (terminalName: string) => {
  return vscode.window.terminals.find(t => t.name === terminalName);
};

const runTestFromExplorer = (testable: Testable) => {
  runTest(testable.file, testable.label);
};

const debugTestFromExplorer = (testable: Testable) => {
  debugTest(testable.file, testable.label);
};

const runTest = (filePath: string, testName: string) => {
  const jestPath = getConfig(ConfigOption.JestPath) || DEFAULT_JEST_PATH;
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);

  let command = `${jestPath} ${filePath} -t ${quoteTestName(testName)}`;
  if (jestConfigPath) {
    command += ` -c ${jestConfigPath}`;
  }

  let terminal = getTerminal(TERMINAL_NAME);
  if (!terminal) {
    terminal = vscode.window.createTerminal(TERMINAL_NAME);
  }
  terminal.show();
  terminal.sendText(command);
};

const debugTest = (filePath: string, testName: string) => {
  const editor = vscode.window.activeTextEditor;
  const jestPath = getConfig(ConfigOption.JestPath) || DEFAULT_JEST_PATH;
  const jestConfigPath = getConfig(ConfigOption.JestConfigPath);

  const args = [filePath, '-t', quoteTestName(testName), '--runInBand'];
  if (jestConfigPath) {
    args.push('-c', jestConfigPath as string);
  }

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

class JestDoItCodeLensProvider implements vscode.CodeLensProvider {
  private runCommand = (args: {
    file: string;
    name: string;
  }): vscode.Command => {
    const runLabel = getConfig(ConfigOption.RunTestLabel) as string;
    return {
      command: 'jestRunIt.runTest',
      title: runLabel ? runLabel : '🏃‍♂️',
      arguments: [args.file, args.name],
      tooltip: 'Run test',
    };
  };

  private debugCommand = (args: {
    file: string;
    name: string;
  }): vscode.Command => {
    const debugLabel = getConfig(ConfigOption.DebugTestLabel) as string;
    return {
      command: 'jestRunIt.debugTest',
      title: debugLabel ? debugLabel : '🐞',
      arguments: [args.file, args.name],
      tooltip: 'Debug test',
    };
  };

  private createLensAt(
    startLine: number,
    startCol: number,
    args: {
      file: string;
      name: string;
    }
  ) {
    // Range values are 0 based.
    let commentLine = new vscode.Range(
      startLine - 1,
      startCol - 1,
      startLine - 1,
      startCol - 1
    );

    let runCodeLens = new vscode.CodeLens(commentLine, this.runCommand(args));
    let debugCodeLens = new vscode.CodeLens(
      commentLine,
      this.debugCommand(args)
    );

    return [runCodeLens, debugCodeLens];
  }

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    try {
      const filePath = document.uri.fsPath;
      const parsed = parse(filePath);

      if (Array.isArray(parsed.describeBlocks)) {
        parsed.describeBlocks.forEach(des => {
          const lenses = this.createLensAt(des.start.line, des.start.column, {
            file: des.file,
            name: des.name,
          });
          codeLenses.push(...lenses);
        });
      }

      if (Array.isArray(parsed.itBlocks)) {
        parsed.itBlocks.forEach(itb => {
          const lenses = this.createLensAt(itb.start.line, itb.start.column, {
            file: itb.file,
            name: itb.name,
          });
          codeLenses.push(...lenses);
        });
      }
    } catch (e) {
      // Do nothing now
      console.log(e);
    }
    return codeLenses;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
