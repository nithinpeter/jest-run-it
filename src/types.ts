export type TestableNode = {
  name: string;
  file: string;
  type: 'it' | 'describe' | 'root';
  children: Array<TestableNode>;
};
