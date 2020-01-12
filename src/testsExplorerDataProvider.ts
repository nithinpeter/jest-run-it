import * as vscode from 'vscode';
import * as path from 'path';
import * as micromatch from 'micromatch';
import { parse } from 'jest-editor-support';

import { getConfig, ConfigOption } from './config';

import { DEFAULT_TEST_FILE_PATTERNS } from './constants';

type TestableNode = {
  name: string;
  type: 'it' | 'describe' | 'root';
  children: Array<TestableNode>;
};

export class TestsExplorerDataProvider implements vscode.TreeDataProvider<Testable> {
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

        const jestRunItExplorerEnabled = micromatch.isMatch(filePath, patterns);

        vscode.commands.executeCommand(
          'setContext',
          'jestRunItExplorerEnabled',
          jestRunItExplorerEnabled
        );
        if (jestRunItExplorerEnabled) {
          this.refresh();
        }
      }
    } else {
      vscode.commands.executeCommand(
        'setContext',
        'jestRunItExplorerEnabled',
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
              child.name,
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
              child.children,
              vscode.TreeItemCollapsibleState.Collapsed
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
    public readonly label: string,
    public readonly children: Array<TestableNode> | undefined,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  get description(): string {
    return this.label;
  }

  iconPath = {
    light: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'light',
      'dependency.svg'
    ),
    dark: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'dark',
      'dependency.svg'
    ),
  };

  contextValue = 'testable';
}
