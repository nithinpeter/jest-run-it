import * as vscode from 'vscode';

export enum ConfigOption {
  JestPath = 'jestPath',
  JestConfigPath = 'jestConfigPath',
  RunTestLabel = 'runTestLabel',
  DebugTestLabel = 'debugTestLabel',
  UpdateSnapshotsLabel = 'updateSnapshotsLabel',
  TestMatchPatterns = 'testMatchPatterns',
  CustomSnapshotMatchers = 'customSnapshotMatchers',
  JestCLIOptions = 'jestCLIOptions',
  ArgumentQuotesToUse = 'argumentQuotesToUse',
  EnvironmentVariables = 'environmentVariables',
}

export type JestRunItConfig = Omit<
  {
    [key in ConfigOption]: string;
  },
  ConfigOption.TestMatchPatterns
> & {
  [ConfigOption.TestMatchPatterns]: Array<string>;
};

export const getConfig = (option: ConfigOption) => {
  const config = vscode.workspace
    .getConfiguration()
    .get<JestRunItConfig>('jestRunIt');

  return config ? config[option] : '';
};
