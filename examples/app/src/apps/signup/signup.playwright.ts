import { Page } from "playwright";
import { create } from "../../../../../packages/playwright";
import { Configuration } from "../../../../../packages/core";

declare const page: Page;

const configuration: Configuration<Page> = {
  id: "signup",
  viewport: { width: 1366, height: 768 },
  visit: {
    path: "/",
  },
  apis: [
    {
      path: "/register",
      deferrals: ["submitting"],
      outcomes: {
        BAD: {
          status: 400,
          body: "Invalid form data",
        },
        OK: {},
      },
    },
  ],
  initial: "noop",
  states: {
    noop: {
      tests: [
        async (page) => await page.waitForSelector("div#root"),
        ["click", "btn-signup"],
        ["waitForSelector", "frm-registration"],
        ["waitForFocus", "txt-name"],
        ["waitForSelector", "txt-email"],
        ["waitForSelector", "txt-age"],
        ["waitForSelector", "txt-password"],
        ["waitForSelector", "txt-repeat-password"],
        ["expectProperty", "btn-register", "disabled", false],
      ],
      on: {
        REGISTER: {
          target: "submitting",
          actions: [
            ["type", "txt-name", "Elton John"],
            ["type", "txt-email", "elton.john@co.uk"],
            ["type", "txt-age", "68"],
            ["type", "txt-password", "rockertman68"],
            ["type", "txt-repeat-password", "rocketman68"],
            ["defer", "submitting"],
            ["click", "btn-register"],
          ],
        },
      },
    },
    submitting: {
      tests: [
        ["expectProperty", "btn-register", "disabled", true],
        ["resolve", "submitting"],
      ],
      on: {
        OK: {
          target: "registrered",
        },
        BAD: {
          target: "failure",
        },
      },
    },
    failure: {
      tests: [["expectProperty", "btn-register", "disabled", false]],
    },
    registrered: {
      tests: [
        ["expectProperty", "welcome", "textContent", "Hello World!"],
        ["resolve", "submitting"],
      ],
    },
  },
};

create({ ports: { ci: 9999 } })(configuration);

