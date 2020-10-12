# XState Marionettist

> Model based testing with [XState] + [Puppeteer] or [Playwright] made easy

The goal of this project is to define a simple configuration "language" allowing developers to create model based end-to-end tests for their applications using [Jest], [XState], and [Puppeteer] or [Playwright].

It abtracts away defining the test machine, creating it's model, and the architecture needed to communicate between intercepted network requests and the model.

You should be somewhat familiar with [XState] but you don't necessarily need to be comfortable with [Puppeteer] or [Playwright].

The configuration is strictly typed using [io-ts]' `Decoder` API.

## **Try it out!:**

Clone or fork this repository and run:

```bash
#: npm install
#: npm test
```

Running `npm install` will install both the dependencies of this project as well as those of the example project in `./examples`.

Running `CI=true && NODE_ENV=production npm test` will:

1. Build the project
2. `cd` into the project folder and
3. `run`npm run e2e` in the example project which will
4. Build the project (`npm run build`)
5. Perform the example end-to-end test.

You can also start up the example ReactJS project in development mode running at localhost:3000 and just run `npm test` in the root of the project.

The example test configuration can be found in [`./examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts`](examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts)

## Installation and project implementation

### Dependenies

```
npm install xstate-marionettist
```

### Peer dependencies

Depending on whether you ar uing [Playwright] or [Puppeteer], `xstate-marionettist` expects the following packages to be part of your project:

- `@xstate/test`
- `jest`
- `puppeteer`
- `jest-puppeteer`
- `playwright`
- `jest-playwright-prese`
- `xstate`

### Implementation

The example project is a good example of implementeting testing with [Jest] and [Puppeteer] or [Playwright]. Feel free to open an issue or send me questions if you are having trouble with this. You can open an issue, contact me on [Twitter] and I'm also active in the Statecharts chat on [Spectrum].

You should at least implement similiar [Jest] configuration files:

- [`jest-config.puppeteer.js`](examples/xstate-marionettist-example/jest.config.js)
- [`jest-puppeteer.config.js`](examples/xstate-marionettist-example/jest.config.js)

Or if you are using [Playwright]

- [`jest-config.playwright.js`](examples/xstate-marionettist-example/jest.config.js)
- [`jest-playwright.config.js`](examples/xstate-marionettist-example/jest.config.js)

[`jest-e2e-setup.js`](examples/xstate-marionettist-example/jest-e2e-setup.js) is optional but helps with bailing out quickly when tests are failing. You'll need to add `jasmine-fail-fast` as a dependency to your project for this.

## Configuration API

| Configuration                   | Description                                                      | Type                                 | Example                                                                                    |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `apis`                          | List of network requests to be intercepted.                      | `[..]?`                              |
| `apis[n].path`                  | Path, URL segment to be matched                                  | `string`                             | `"/token"`                                                                                 |
| `apis[n].deferrals`             | Deferrals are used to block requests until some tests are run    | `string[]?`                          | `["submitting"]`                                                                           |
| `apis[n].outcomes`              | Map of request response configuration(s) for different outcomes. | `[..]?`                              |
| `apis[n].outcomes[".."].status` | Resposne status number                                           | `number?`                            | `500`                                                                                      |
| `apis[n].outcomes[".."].body`   | Resposne body                                                    | `json?`                              | { .. }                                                                                     |
| `outcomes`                      | Unique list of outcomes.                                         | `string[]?`                          | `["OK", "BAD", "NETWORK_DOWN"]`                                                            |
| `viewport`                      | Viewport configuration passed to puppeteer.                      | `{ width: number, height: number }?` | `{ width: 1366, height: 768 }`                                                             |
| `id`                            | Unique identifier                                                | `string`                             | `"loginTestMachine"`                                                                       |
| `visit`                         | URL of the site or app to be tested.                             | `{ path: string }`                   | `"http://localhost:7777/login"`                                                            |
| `initial`                       | The initial state of the test machine                            | `string`                             | `"noop"`, `"stepOne"`                                                                      |
| `states`                        | Map of states, just like in xstate                               | { ... }                              |
| `state.tests`                   | List of tests to be performed for that state                     | `Action[]?`                          |
| `state.tests[n]`                | A test                                                           | `Action`                             | `["waitForSelector", "btn-login"], ["expectProperty", "title", "textContent", "Welcome!"]` |
| `state.on`                      | Map of events that transition the state and perform actions      | `{ ... }?`                           |
| `state.on.target`               | Target state                                                     | `string?`                            | `"submitting"`                                                                             |
| `state.on.actions`              | List of actions to be performed                                  | `Action[]?`                          | `["type", "txt-username", "jane.doe"]`                                                     |

### Actions

Actions are instructions for [Jest] and / or [Puppeteer] and can be attached to tests or events. By default, anything using a selector expects that is was defined using a `data-testid` attribute. All selector actions wrap names with: `[data-testid~="name"]` matching any words. You can override this behaviour by importing the `make` function rather than the `test` function from `xstate-marionettist` and create your own version of the `test` function:

```ts
// custom-test.ts
import { make } from "xstate-marionettist";

// or if you are using Playwright

import { makePlay } from "xstate-marionettist"

export const test = make({ selectorWrapper: (name: string) => name }); // for no wrapping at all
export const test = make({
  selectorWrapper: (name: string) => `[data-my-custom-test-id="${name}"]`,
});

// my-e2e.ts
import { test } from './custom-test'

test({ ... })
```

Other options that can be passed to `make` are:

```ts
{
  // Defaults to "localhost"
  server?: string;

  // Defaults to false
  // Adds the query paramter xstate-inspect=false|true to the visited
  // url allowing you to disable the inspector when running tests.
  // See the example project's index.tsx file.
  xstateInspect?: boolean,

  // What port the visited url is hosted at
  // Listed values are the defaults
  ports?: {
    ci?: 7777;
    prod?: 7777;
    dev?: 3000;
  };
}
```

Availeable actions are:

| Name            | Type                                       | Description                                                             | Example                                                                                                             |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Page function   | `(page: Page) => unknown                   | Promise<unknown>`                                                       | A function that receive puppeteer's `Page` object allowing you to execute whatever test or action you want with it. | `page => page.waitForSelector("#id.classname[attribute="value"])` |
| delay           | `["delay", number]`                        | Delay a test or action.                                                 | `["delay", 1000]`                                                                                                   |
| waitForSelector | `["waitForSelector", string]`              | Wait for a slice of DOM                                                 | `["waitForSelector", "btn-login"]`                                                                                  |
| waitForFocus    | `["waitForFocus", string]`                 | Wait for dom element to be the active one                               | `["waitForFocus", "txt-email"]`                                                                                     |
| click           | `["click", string]`                        | Simulate a click on an element                                          | `["click", "btn-submit"]`                                                                                           |
| type            | `["type", string]`                         | Simulate typing                                                         | `["type", "text-password", "123abc!"]`                                                                              |
| select          | `["select", string, string]`               | Simulate selecting an option in a drop down                             | `["type", "cmb-province", "AB"]`                                                                                    |
| expectProperty  | `["expectProperty", string, string, number | boolean                                                                 | string]`                                                                                                            | Test if a elements property matches a value | `["expectProperty", "txt-email", "value", "foo@bar.com]` |
| defer           | `["defer", string]`                        | Push a promise to the buffer for blocking network requests              | `["defer", "form-submit"]`                                                                                          |
| resolve         | `["resolve", string]`                      | Resolve a promise in the buffer that might be blocking network requests | `["resolve", "form-submit"]`                                                                                        |

# Example

Let's review the example test's configuration availabe in the example project. The project is a ReactJS application created using _create-react-app_ and renders a simple login form. The test is located at [`./examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts`](examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts).

The configuration models 4 different states:

- noop: _State where users can enter their email and password and click login._
- authenticating: _State reflecting the UI is blocked and busy_
- failure: _Failure outcome state_
- authenticated: _Success outcome state_

The configuration for the _noop_ state is as follows:

```ts
noop: {
    tests: [
      page => page.waitForSelector("div#root"),
      ["waitForSelector", "frm-login"],
      ["waitForFocus", "txt-email"],
      ["waitForSelector", "txt-password"],
      ["expectProperty", "btn-login", "disabled", false],
    ],
    on: {
        LOGIN: {
            target: "authenticating",
            actions: [
            ["type", "txt-email", "pianoman@xstatejs.org"],
            ["type", "txt-password", "statechartsareawesome"],
            ["defer", "submitting"],
            ["click", "btn-login"],
            ],
        },
    },
},
```

This state has a couple of tests. The first one examplifies usage of plain functions allowing you to write your own tests with the page object. This is followed by a `"waitForSelector"` action which is just a wrapper around Puppeteer's `page.waitForSelector`. `"waitForFocus"` uses the `Page` object to compose `document.activeElement` against the selected element. In our case the _email_ input should take focus after the first render. The test verifies if the password field is present and if the submit button is enabled.

`.on.LOGIN` should look familiar to you as it maps directly to a proper state machine configured using XState. The actions defined here however are translated into proper functions passed to the test model built using _@xstate/test_'s `createModel` API. THE `"type"` and `"click"` actions map directly to puppeteer intructions simulating typing and clicking:

```ts
    await page.type('[data-testid="txt-email"]', "pianoman@xstatejs.org"),
    await page.type('[data-testid="txt-password"]', "statechartsareawesome"),
    ...
    await page.click('[data-testid="btn-login"]'),
```

The `"defer"` action is executed before clicking the button. Under the hood puppeteer's API for intercepting network requests is used to mock and block API responses. The order of execution here will be:

1. `"defer"` puts a promise in a buffer
2. Puppeteer clicks the button in the UI
3. The UI makes a network request to login
4. Puppeteer intercepts the network request, checks the buffer for unresolved promises and blocks if any are in there.
5. The test model moves on to the _authenticating_ state's tests.

The next state that will be tested is the _authenticating_ state:

```ts
authenticating: {
    tests: [
        ["expectProperty", "btn-login", "disabled", true],
        ["resolve", "submitting"],
      ],
      on: {
        OK: {
          target: "authenticated",
        },
        BAD: {
          target: "failure",
        },
    },
},
```

The first test translates to a puppeteer instruction for retrieving an element's property and using _Jest_'s `expect` API to test the value. In this case the button should be disabled while the form is busy submitting.

The next action in the list of tests in not really a test but an instruction to resolve the promise that was put in the buffer using the `"defer"` action. This will cause the intercepted request to continue on. Our configuration has defined a matching path and for such cases the intercepted request is mocked. Requests that have no matching path are not mocked.

Each event type that transitions the model to a state where a mocked/blocked network request is made should be added to the top-level `.outcomes` property. This important or otherwise mocked responses are not matched up. I'll write up an explanation of the underlying machinery in a different readme.

In this case we have an _OK_ and a _BAD_ outcome. The API configuration also allows you to define a response status and payload for each outcome. The default response status is 200 and an empty body. You can also define a status and body for all outcome using an asterisk:

```ts
  apis: [
    {
      path: "/greet",
      deferrals: ["greet"],
      outcomes: {
        *: {
          status: 200,
          body: "Hello World!"
        },
      },
    },
  ],
```

From here the test model splits up in to two different outcomes since the _authenticating_ state has two events configured that transition to different states. Let's look at the _BAD/failure_ combination first.

```ts
 failure: {
    tests: [
        ["expectProperty", "btn-login", "disabled", true],
        ["resolve", "submitting"],
        ["waitForSelector", "txt-email-helptext-error"],
    ],
    on: {
        NOOP: {
            target: "noop",
        }
    }
},
```

The tests for this state first determine if the button is disabled since this should be the case while the network request is in progress. Then it resolves the promise that was pushed into the buffer earlier causuing the network request to be unblocked and continue. Since we have defined a custom payload for outcome _BAD_ the response should have status `400` and contain `"Invalid token"`.

Before allowing the model to transition back to _noop_ state we block with a test expecting an error message. The configuration and tests for the _authenticated_ state follow the same pattern.

[xstate]: https://xstate.js.org/
[puppeteer]: https://pptr.dev/
[playwright]: https://playwright.dev/
[jest]: https://jestjs.io/
[io-ts]: https://github.com/gcanti/io-ts
[twitter]: https://twitter.com/chautelly
[spectrum]: https://spectrum.chat/statecharts?tab=posts
