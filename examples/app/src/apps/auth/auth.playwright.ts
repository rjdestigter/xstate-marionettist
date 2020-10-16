import { Page } from "playwright";
import { create } from "../../../../../packages/playwright";
import { Configuration } from "../../../../../packages/core";

declare const page: Page;

const configuration: Configuration<Page> = {
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
  initial: "noop",
  states: {
    noop: {
      tests: [
        (page) => page.waitForSelector("div#root"),
        ["click", "btn-auth"],
        ["waitForSelector", ["frm-login", "txt-password"]],
        ["waitForFocus", "txt-email"],
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
        ["waitForSelector", "txt-email-helptext-error"],
        ["expectProperty", "btn-login", "disabled", false],
      ],
    },
    authenticated: {
      tests: [
        ["expectProperty", "welcome", "textContent", "Hello World!"],
        ["resolve", "submitting"],
      ],
    },
  },
};

create({ ports: { ci: 9999 } })(configuration);
