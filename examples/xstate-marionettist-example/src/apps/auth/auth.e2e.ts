import { Page } from "puppeteer";
import test, { Configuration } from "../../../../../dist";

const configuration: Configuration = {
  id: "xstateMarionetteExample",
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
        ["resolve", "submitting"],
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

test(configuration);
