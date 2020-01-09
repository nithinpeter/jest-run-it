import * as vscode from 'vscode';
import { parse } from 'jest-editor-support';

type JestifydeConfig = {
  jestPath: string;
  jestConfig: string;
};

const DEFAULT_JEST_PATH = 'node_modules/.bin/jest';

const quoteTestName = (testName: string) => {
  // escape double quotes
  const escaped = testName.replace(/'/g, "\\'");
  return `'${escaped}'`;
};

const buildCommand = (filePath: string, testName: string) => {
  const config = vscode.workspace
    .getConfiguration()
    .get<JestifydeConfig>('jestifyde');

  const command = `${(config && config.jestPath) ||
    DEFAULT_JEST_PATH} ${filePath} -t ${quoteTestName(testName)}`;

  return command;
};

const getTerminal = (terminalName: string) => {
  return vscode.window.terminals.find(t => t.name === terminalName);
};

const runTest = (filePath: string, testName: string) => {
  const TERMINAL_NAME = 'Jestifyde';
  const command = buildCommand(filePath, testName);

  let terminal = getTerminal(TERMINAL_NAME);
  if (!terminal) {
    terminal = vscode.window.createTerminal(TERMINAL_NAME);
  }
  terminal.show();
  terminal.sendText(command);
};

const debugTest = (filePath: string, testName: string) => {
  const editor = vscode.window.activeTextEditor;

  const config = vscode.workspace
    .getConfiguration()
    .get<JestifydeConfig>('jestifyde');

  const jestPath = (config && config.jestPath) || DEFAULT_JEST_PATH;
  const args = [filePath, '-t', quoteTestName(testName), '--runInBand'];

  const debugConfig: vscode.DebugConfiguration = {
    console: 'integratedTerminal',
    internalConsoleOptions: 'neverOpen',
    name: 'Jestifyde',
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
  const runTestCommand = vscode.commands.registerCommand(
    'jestifyde.runTest',
    runTest
  );
  context.subscriptions.push(runTestCommand);

  const debugTestCommand = vscode.commands.registerCommand(
    'jestifyde.debugTest',
    debugTest
  );
  context.subscriptions.push(debugTestCommand);

  const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    {
      pattern: '**/*.test.{js,jsx,ts,tsx}',
      scheme: 'file',
    },
    new JestifyedCodeLensProvider()
  );
  context.subscriptions.push(codeLensProviderDisposable);
};

class JestifyedCodeLensProvider implements vscode.CodeLensProvider {
  private runCommand = (args: [string, string]): vscode.Command => ({
    command: 'jestifyde.runTest',
    title: 'Run test',
    arguments: args,
  });

  private debugCommand = (args: [string, string]): vscode.Command => ({
    command: 'jestifyde.debugTest',
    title: 'Debug test',
    arguments: args,
  });

  private createLensAt(
    startLine: number,
    startCol: number,
    args: [string, string]
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
          const lenses = this.createLensAt(des.start.line, des.start.column, [
            des.file,
            des.name,
          ]);
          codeLenses.push(...lenses);
        });
      }

      if (Array.isArray(parsed.itBlocks)) {
        parsed.itBlocks.forEach(itb => {
          const lenses = this.createLensAt(itb.start.line, itb.start.column, [
            itb.file,
            itb.name,
          ]);
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
