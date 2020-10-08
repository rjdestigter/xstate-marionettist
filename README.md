# XState Marionettist

Model based testing with XState + Puppeteer made easy

This project contains some code allowing you to define an end-to-end-ish test as a configuration that is transformed into a test using `jest`, `@xstate/test`, and `puppeteer`

## Instructions

**Try it out!:**

```bash
#: npm install
#: npm test
```

Running `npm install` will install both the dependencies in the project root as well as the example project in `./examples`.

Running `npm test` will:

- Build the project
- `cd` into the project folder and
- `run`npm run e2e` in the example project which will
- build the project (`npm run build`)
- Perform the example end-to-end test.

The example test can be found in `./examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts`
