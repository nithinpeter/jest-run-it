import * as vscode from 'vscode';
import { parse } from 'jest-editor-support';

async function addConsoleLog() {
  let lineNumStr = await vscode.window.showInputBox({
    prompt: 'Line Number',
  });

  let lineNum = +(lineNumStr || 0);

  let insertionLocation = new vscode.Range(lineNum - 1, 0, lineNum - 1, 0);
  let snippet = new vscode.SnippetString('console.log($1);\n');

  vscode.window.activeTextEditor!.insertSnippet(snippet, insertionLocation);
}

export function activate(context: vscode.ExtensionContext) {
  let commandDisposable = vscode.commands.registerCommand(
    'extension.addConsoleLog',
    addConsoleLog
  );

  context.subscriptions.push(commandDisposable);

  let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
    {
      pattern: '**/*.test.{js,jsx,ts,tsx}',
      scheme: 'file',
    },
    new JestifyedCodeLensProvider()
  );

  context.subscriptions.push(codeLensProviderDisposable);
}

class JestifyedCodeLensProvider implements vscode.CodeLensProvider {
  private static runCommand: vscode.Command = {
    command: 'extension.addConsoleLog',
    title: 'Run test',
  };

  private static debugCommand: vscode.Command = {
    command: 'extension.addConsoleLog',
    title: 'Debug test',
  };

  private createLensAt(startLine: number, startCol: number) {
    // Range values are 0 based.
    let commentLine = new vscode.Range(
      startLine - 1,
      startCol - 1,
      startLine - 1,
      startCol - 1
    );

    let runCodeLens = new vscode.CodeLens(
      commentLine,
      MyCodeLensProvider.runCommand
    );
    let debugCodeLens = new vscode.CodeLens(
      commentLine,
      MyCodeLensProvider.debugCommand
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
      if (Array.isArray(parsed.itBlocks)) {
        parsed.itBlocks.forEach(itb => {
          const news = this.createLensAt(itb.start.line, itb.start.column);
          codeLenses.push(...news);
        }, []);
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
