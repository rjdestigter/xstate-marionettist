import { Page } from "playwright";
import { create } from "../../../../../packages/playwright";
import { Configuration } from "../../../../../packages/core";

declare const page: Page;

const configuration: Configuration<Page> = {
  id: "main",
  viewport: { width: 1366, height: 768 },
  visit: {
    path: "/",
  },
  initial: "main",
  states: {
    main: {
      tests: [
        (page) => page.waitForSelector("div#root"),
        (page) =>
          page.waitForSelector(
            '.mdc-button--unelevated[data-testid="btn-main"]'
          ),
        (page) =>
          page.waitForSelector('.mdc-button--outlined[data-testid="btn-auth"]'),
        (page) =>
          page.waitForSelector(
            '.mdc-button--outlined[data-testid="btn-signup"]'
          ),
        ["expectProperty", "content", "childElementCount", 0],
      ],
      on: {
        GO_TO_AUTH: {
          target: "auth",
          actions: [["click", "btn-auth"]],
        },
        GO_TO_SIGNUP: {
          target: "signup",
          actions: [["click", "btn-signup"]],
        },
      },
    },
    auth: {
      tests: [
        (page) => page.waitForSelector("div#root"),
        (page) =>
          page.waitForSelector(
            '.mdc-button--unelevated[data-testid="btn-auth"]'
          ),
        (page) =>
          page.waitForSelector('.mdc-button--outlined[data-testid="btn-main"]'),
        (page) =>
          page.waitForSelector(
            '.mdc-button--outlined[data-testid="btn-signup"]'
          ),
        ["expectProperty", "content", "childElementCount", 1],
      ],
      on: {
        GO_TO_MAIN: {
          target: "main",
          actions: [["click", "btn-main"]],
        },
        GO_TO_SIGNUP: {
          target: "signup",
          actions: [["click", "btn-signup"]],
        },
      },
    },
    signup: {
      tests: [
        (page) => page.waitForSelector("div#root"),
        (page) =>
          page.waitForSelector(
            '.mdc-button--unelevated[data-testid="btn-signup"]'
          ),
        (page) =>
          page.waitForSelector('.mdc-button--outlined[data-testid="btn-auth"]'),
        (page) =>
          page.waitForSelector('.mdc-button--outlined[data-testid="btn-main"]'),
        ["expectProperty", "content", "childElementCount", 2],
      ],
      on: {
        GO_TO_MAIN: {
          target: "main",
          actions: [["click", "btn-main"]],
        },
        GO_TO_AUTH: {
          target: "auth",
          actions: [["click", "btn-auth"]],
        },
      },
    },
  },
};

create({ ports: { ci: 9999 } })(configuration);
