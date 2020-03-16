import * as vscode from 'vscode';
import { parse } from 'jest-editor-support';

import { getConfig, ConfigOption } from './config';

export class JestDoItCodeLensProvider implements vscode.CodeLensProvider {
  private runCommand = (args: {
    file: string;
    name: string;
  }): vscode.Command => {
    const runLabel = getConfig(ConfigOption.RunTestLabel) as string;
    return {
      command: 'jestRunItCodeLens.runTest',
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
      command: 'jestRunItCodeLens.debugTest',
      title: debugLabel ? debugLabel : '🐞',
      arguments: [args.file, args.name],
      tooltip: 'Debug test',
    };
  };
  private updateSnapshotsCommand = (args: {
    file: string;
    name: string;
  }): vscode.Command => {
    const updateSnapshotsLabel = getConfig(ConfigOption.UpdateSnapshotsLabel) as string;
    return {
      command: 'jestRunItCodeLens.updateSnapshots',
      title: updateSnapshotsLabel ? updateSnapshotsLabel : '👍',
      arguments: [args.file, args.name],
      tooltip: 'Update snapshots',
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
    let updateSnapshotsCodeLens = new vscode.CodeLens(
      commentLine,
      this.updateSnapshotsCommand(args)
    );
    return [runCodeLens, debugCodeLens, updateSnapshotsCodeLens];
  }
  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    // Don't provide anything if the file is dirty
    if (document.isDirty) {
      return Promise.resolve([]);
    }

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
