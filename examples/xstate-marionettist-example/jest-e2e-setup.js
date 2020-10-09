/* eslint-disable */

/**
 * Fail after the first test in a single test suite fails. This is NOT the same as jest's
 * --bail option, which works across test suites
 */
// if (process.env.FAIL_FAST) {
// Jasmine definition from @types/jest does not have `getEnv` for some reason
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jest/index.d.ts
// However this empirically works with jest 22.3.0. So we'll cast to any for now
const jasmineEnv = jasmine.getEnv();
jasmineEnv.addReporter(require("jasmine-fail-fast").init());
// }
