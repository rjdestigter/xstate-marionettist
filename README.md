# XState Marionettist

Model based testing with XState + Puppeteer made easy

This project contains some code allowing you to define an end-to-end-ish test as a configuration that is transformed into a test using `jest`, `@xstate/test`, and `puppeteer`. It makes it very easy to mock and test all possible network responses your app might encounter. Creating a configuration is also quite painless since it is strictly typed using `io-ts`' `Decoder` API.

It abtracts away defining the test machine configuration, writing tests for each state and events

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

## Documentation

### Configuration

| Configuration                   | Description                                                      | Type                                 | Example                                                                                    |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `apis`                          | List of network requests to be intercepted.                      | `[..]?`                              |
| `apis[n].path`                  | Path, URL segment to be matched                                  | `string`                             | `"/token"`                                                                                 |
| `apis[n].deferrals`             | Deferrals are used to block requests until some tests are run    | `string[]?`                          | `["submitting"]`                                                                           |
| `apis[n].outcomes`              | Map of request response configuration(s) for different outcomes. | `[..]?`                              |
| `apis[n].outcomes[".."].status` | Resposne status number                                           | `number?`                            | `500`                                                                                      |
| `apis[n].outcomes[".."].body`   | Resposne body                                                    | `json?`                              | <pre lang="json">{<br /> access_token: "abc123",<br /> user: "jane.doe"<br />}</pre>       |
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

Actions are instructions for jest and/or puppeteer and can be attached to tests or events. The following actions are currently supported:

> _! Anything using a selector expects that to be wrapped using the `data-testid` attribute._ `waitForSelector` and `expectProperty` wrap names with:
> `[data-testid~="name"]` matching any words. We'll make this configurable in the future.

| Name            | Type                                       | Description                                                             | Example                                |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------- |
| delay           | `["delay", number]`                        | Delay a test or action                                                  | `["delay", 1000]`                      |
| waitForSelector | `["waitForSelector", string]`              | Wait for a slice of DOM                                                 | `["waitForSelector", "btn-login"]`     |
| waitForFocus    | `["waitForFocus", string]`                 | Wait for dom element to be the active one                               | `["waitForFocus", "txt-email"]`        |
| click           | `["click", string]`                        | Simulate a click on an element                                          | `["click", "btn-submit"]`              |
| type            | `["type", string]`                         | Simulate typing                                                         | `["type", "text-password", "123abc!"]` |
| select          | `["select", string, string]`               | Simulate selecting an option in a drop down                             | `["type", "cmb-province", "AB"]`       |
| expectProperty  | `["expectProperty", string, string, number | boolean                                                                 | string]`                               | Test if a elements property matches a value | `["expectProperty", "txt-email", "value", "foo@bar.com]` |
| defer           | `["defer", string]`                        | Push a promise to the buffer for blocking network requests              | `["defer", "form-submit"]`             |
| resolve         | `["resolve", string]`                      | Resolve a promise in the buffer that might be blocking network requests | `["resolve", "form-submit"]`           |

# Example

Let's review the example test's configuration availabe in the example project. The project is a ReactJS application created using _create-react-app_ and renders a simple login form. The test is located at `./examples/xstate-marionettist-example/src/apps/auth/auth.e2e.ts`.

The configuration models 4 different states:

- noop: _State where users can enter their email and password and click login._
- authenticating: _State reflecting the UI is blocked and busy_
- failure: _Failure outcome state_
- authenticated: _Success outcome state_

The configuration for the _noop_ state is as follows:

```ts
noop: {
    tests: [["waitForSelector", "frm-login"]],
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

This state has 1 test and makes sure the login form is available in the DOM. Under the hood puppeteer's _waitForSelector_ API is used:

```ts
page.waitForSelector('[data-testid="frm-login"]');
```

`.on.LOGIN` should look familiar to you as it maps directly to a proper state machine configured using XState. The actions defined here however are translated into proper functions passed to the test model built using _@xstate/test_'s `createModel` API. THE `"type"` and `"click"` actions map directly to puppeteer intructions simulating typing and clicking:

```ts
    await page.type('[data-testid="txt-email"]', "pianoman@xstatejs.org"),
    await page.type('[data-testid="txt-password"]', "statechartsareawesome"),
    ...
    await page.click('[data-testid="btn-login"]'),
```

The `"defer"` action is executed before clicking the button. Under the hood puppteee's API for interepting network requests is used to mock and block API responses. The order of execution here will be:

1. `"defer"` puts a promise in a buffer
2. Puppteer clicks the button in the UI
3. The UI makes a network request to login
4. Puppteer intercepts the network request, checks the buffer for unresolved promises and blocks if any are in there.
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

The first test translates to a puppteer intruction for retrieving an element's property and using _Jest_'s `expect` API to test the value. In this case the button should be disabled while the form is busy submitting.

The next action in the list of tests in not really a test but an instruction to resolve the promise that was put in the buffer using the `"defer"` action. This will cause the intercepted request to continue on. Our configuration has defined a matching path and for such cases the intercepted request is mocked. Requests that have no matching path are not mocked.

Each event type that transitions the model to a state where a mocked/bloced network request is made should be added to the top-level `.outcomes` property. This important or otherwise mocked responses are not matched up. I'll write up an explanation of the underlying machinary in a different readme.

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
