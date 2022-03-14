import * as vscode from 'vscode';
import {
  parse,
  Snapshot,
  Location,
  SnapshotMetadata,
  ParsedNode,
  ParsedNodeTypes,
} from 'jest-editor-support';
import { getConfig, ConfigOption } from './config';

interface ISnapshotRange {
  start: Location;
  end: Location;
}

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
    const updateSnapshotsLabel = getConfig(
      ConfigOption.UpdateSnapshotsLabel
    ) as string;
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
    },
    includeSnapshotCodeLens: boolean
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
    if (includeSnapshotCodeLens) {
      let updateSnapshotsCodeLens = new vscode.CodeLens(
        commentLine,
        this.updateSnapshotsCommand(args)
      );
      return [runCodeLens, debugCodeLens, updateSnapshotsCodeLens];
    } else {
      return [runCodeLens, debugCodeLens];
    }
  }

  private hasSnapshots(
    range: ISnapshotRange,
    metadataList: SnapshotMetadata[]
  ): boolean {
    for (const metadata of metadataList) {
      const isLargerOrEqualToStart =
        metadata.node.loc.start.line > range.start.line ||
        (metadata.node.loc.start.line === range.start.line &&
          metadata.node.loc.start.column >= range.start.column);
      const isSmallerOrEqualToEnd =
        metadata.node.loc.end.line < range.end.line ||
        (metadata.node.loc.end.line === range.end.line &&
          metadata.node.loc.end.column <= range.end.column);

      if (isLargerOrEqualToStart && isSmallerOrEqualToEnd) {
        return true;
      }
    }
    return false;
  }

  genCodeLens(codeLenses: vscode.CodeLens[], node: ParsedNode, prefixTestName: string, metadata: SnapshotMetadata[]) {
    if ([ParsedNodeTypes.describe, ParsedNodeTypes.it].includes(node.type)) {
      const name = (prefixTestName ? prefixTestName + ' ' : '') + (node as any).name;
      const lenses = this.createLensAt(
        node.start.line,
        node.start.column,
        {
          file: node.file,
          name,
        },
        this.hasSnapshots(node, metadata)
      );
      codeLenses.push(...lenses);

      node.children?.forEach(child => this.genCodeLens(codeLenses, child, name, metadata))
    }
    return codeLenses;
  }

  async provideCodeLenses(
    document: vscode.TextDocument
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    // Don't provide anything if the file is dirty
    if (document.isDirty) {
      return Promise.reject();
    }

    try {
      const filePath = document.uri.fsPath;
      const parsed = parse(filePath);

      const customSnapshotMatchers = getConfig(
        ConfigOption.CustomSnapshotMatchers
      ) as string[];
      const snapshot = new Snapshot(undefined, customSnapshotMatchers);
      const metadata = await snapshot.getMetadata(filePath);

      parsed.root.children?.forEach(child => codeLenses.push(...this.genCodeLens([], child, '', metadata)));
    } catch (e) {
      // Do nothing now
      console.log(e);
    }

    return codeLenses;
  }
}
