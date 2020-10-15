import test from "../../../../../packages/cypress/dist";
import { Configuration } from "../../../../../packages/core/dist";

import {} from "cypress";

const configuration: Configuration<typeof cy> = {
  id: "auth",
  viewport: { width: 1366, height: 768 },
  visit: {
    path: "/",
  },
  apis: [
    {
      path: "/token",
      deferrals: ["submitting"],
      outcomes: {
        BAD: {
          status: 400,
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
      tests: [["waitForSelector", "btn-auth"]],
      on: {
        ROUTE_LOGIN: {
          target: "login",
          actions: [["click", "btn-auth"]],
        },
      },
    },
    login: {
      tests: [
        ["waitForSelector", ["frm-login", "txt-email", "txt-password"]],
        ["waitForFocus", "txt-email"],
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
    authenticating: {
      tests: [
        ["expectProperty", "btn-login", "disabled", true],
        ["waitForSelector", ["frm-login", "txt-email", "txt-password"]],
      ],
      on: {
        OK: {
          target: "authenticated",
          actions: [["resolve", "submitting"]],
        },
        BAD: {
          target: "failure",
          actions: [["resolve", "submitting"]],
        },
      },
    },
    failure: {
      tests: [
        ["waitForSelector", "txt-email-helptext-error"],
        ["expectProperty", "btn-login", "disabled", false],
      ],
    },
    authenticated: {
      tests: [
        ["expectProperty", "welcome", "textContent", "Hello World!"],
      ],
    },
  },
};

test(configuration);
