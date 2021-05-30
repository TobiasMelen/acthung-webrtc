import nodeAssert from "assert";
let tests: Promise<void>[] = [];

process && process.on('unhandledRejection', error => {
  throw error;
});

export default async function test(
  message: string,
  fn: (assert: (condition: boolean) => void) => void | Promise<void>
) {
  const promise = (
    fn((condition) => nodeAssert(condition, message)) || Promise.resolve()
  ).then(() => console.log(`✅ ${message}`));
  tests.push(promise);
}
queueMicrotask(async () => await Promise.all(tests));
