import test, { Configuration } from "../../../../../dist";

const configuration: Configuration = {
  id: "xstateMarionetteExample",
  viewport: { width: 1366, height: 768 },
  visit: {
    path: "/saad-apply",
  },
  apis: [
    {
      path: "/token",
      deferrals: ["submitting"],
      outcomes: {
        BAD: {
          status: 500,
          body: "Invalid token",
        },
        OK: {
          body: {
            access_token: "123",
            refresh_token: "abc",
          },
        },
      },
    },
  ],
  outcomes: ["OK", "BAD"],
  initial: "noop",
  states: {
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
    failure: {
      tests: [
        ["expectProperty", "btn-login", "disabled", true],
        ["waitForSelector", "txt-email-helptext"],
        ["resolve", "submitting"],
      ],
      on: {
        ANY: {
          target: "noop",
        },
      },
    },
    authenticated: {
      tests: [
        ["expectProperty", "welcome", "textContent", "Hello World!"],
        ["resolve", "submitting"],
      ],
    },
  },
};

test(configuration);
