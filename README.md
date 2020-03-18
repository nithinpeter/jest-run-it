<center>

# Jest Run It - Jest Test Runner for VS Code

<strong>Run and debug your Jest tests with ease from VS Code</strong>

</center>

A VS Code extension that will help you run and debug Jest tests from your editor.
You no longer have to run your entire test suite for that one test you changed 🎉

![](https://github.com/nithinpeter/jestifyde/blob/master/readme-resources/jest-run-it-1.gif?raw=true)

## Getting Started

1. [Install the extension.](https://marketplace.visualstudio.com/items?itemName=vespa-dev-works.jestRunIt)
2. Open the test file.
3. Run tests.

## Troubleshooting.

1. You don't see the run/link buttons:
   If you are not seeing the buttons for running the tests, it could be because the plugin did not recognize the file as a test file. You need to update the test match patterns so that it will be recognized as a test file. See the [config options](#config-options) section to see more details.

2. Your Jest is installed differently:
   There is a config option to specify your Jest path. See the [config options](#config-options).

## Config Options

| Option              | Description                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Jest Config Path         | Jest config file path relative to the current workspace (e.g: ./jest.config.js)                                     |
| Jest Path                | Absolute path to the Jest binary (default: node_modules/.bin/jest) |
| Run Test Label           | Label for the run test action |
| Debug Test Label         | Label for the debug test action |
| Update Snapshosts Label  | Label for update snapshots action |
| Custom Snapshot Matchers | Custom snapshot matchers |
| Test Match Patterns | Glob patterns to match test files (default: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/__tests__/*.{js,jsx,ts,tsx}']) |

## Features

#### 1. Run/debug individual tests from any test file:

![](https://github.com/nithinpeter/jestifyde/blob/master/readme-resources/jest-run-it-2.gif?raw=true)

#### 2. Test explorer view:

![](https://github.com/nithinpeter/jestifyde/blob/master/readme-resources/jest-run-it-explorer.png?raw=true)

#### 3. Editor title actions to run/debug tests:

![](https://github.com/nithinpeter/jestifyde/blob/master/readme-resources/jest-run-it-editor-title.png?raw=true)
