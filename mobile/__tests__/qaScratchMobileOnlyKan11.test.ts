/**
 * Scratch test for QA verification of KAN-11 AC-3/AC-4 path-scoping (dorny/paths-filter
 * `changes` job in .github/workflows/build-and-test.yml). This file touches only mobile/**
 * so that the CI run it triggers proves: mobile-build-and-test runs, build-and-test (backend)
 * is skipped. Delete once the AC-3/AC-4 verification run has been observed - not meant to
 * remain in the suite long-term.
 */
describe("KAN-11 AC-3/AC-4 mobile-only path scoping scratch probe", () => {
  it("is a no-op assertion, present only to produce a mobile-only diff", () => {
    expect(true).toBe(true);
  });
});
