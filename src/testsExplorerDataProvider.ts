import * as vscode from 'vscode';
import * as micromatch from 'micromatch';
import { parse } from 'jest-editor-support';

import { getConfig, ConfigOption } from './config';
import { DEFAULT_TEST_FILE_PATTERNS } from './constants';
import { TestableNode } from './types';

export class TestsExplorerDataProvider
  implements vscode.TreeDataProvider<Testable> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Testable | undefined
  > = new vscode.EventEmitter<Testable | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Testable | undefined> = this
    ._onDidChangeTreeData.event;

  constructor() {
    vscode.window.onDidChangeActiveTextEditor(() =>
      this.onActiveEditorChanged()
    );
    // Call the first time
    this.onActiveEditorChanged();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  onActiveEditorChanged(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      if (editor.document.uri.scheme === 'file') {
        const filePath = editor.document.uri.fsPath;
        const testMatchPatternsConfig = getConfig(
          ConfigOption.TestMatchPatterns
        ) as Array<string>;

        const patterns = Array.isArray(testMatchPatternsConfig)
          ? testMatchPatternsConfig
          : DEFAULT_TEST_FILE_PATTERNS;

        const jestRunItActive = micromatch.isMatch(filePath, patterns);

        vscode.commands.executeCommand(
          'setContext',
          'jestRunItActive',
          jestRunItActive
        );
        if (jestRunItActive) {
          this.refresh();
        }
      }
    } else {
      vscode.commands.executeCommand(
        'setContext',
        'jestRunItActive',
        false
      );
    }
  }

  getTreeItem(element: Testable): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Testable): Thenable<Testable[]> | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    if (element) {
      if (element.children) {
        return Promise.resolve(
          element.children.map(child => {
            return new Testable(
              element.testName + ' ' + child.name,
              child.name,
              child.file,
              child.children,
              child.type === 'it'
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Expanded
            );
          })
        );
      }

      return null;
    } else {
      const filePath = editor.document.uri.fsPath;
      const parsed = parse(filePath);
      const children = (parsed.root.children as unknown) as Array<TestableNode>;

      if (children) {
        return Promise.resolve(
          children.map(child => {
            return new Testable(
              child.name,
              child.name,
              child.file,
              child.children,
              child.type === 'it'
                ? vscode.TreeItemCollapsibleState.None
                : vscode.TreeItemCollapsibleState.Expanded
            );
          })
        );
      }

      return null;
    }
  }
}

export class Testable extends vscode.TreeItem {
  constructor(
    public readonly testName: string,
    public readonly label: string,
    public readonly file: string,
    public readonly children: Array<TestableNode> | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  tooltip = this.testName;
  contextValue = 'testable';
}
