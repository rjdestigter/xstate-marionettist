import test from "../../../../../packages/cypress/dist";
import { Configuration } from "../../../../../packages/core/dist";

import {} from "cypress";

const configuration: Configuration<typeof cy> = {
  id: "main",
  viewport: { width: 1366, height: 768 },
  visit: {
    path: "/",
  },
  initial: "main",
  states: {
    main: {
      tests: [
        (cy) => cy.get("div#root"),
        (cy) =>
          cy.get(
            '.mdc-button--unelevated[data-testid="btn-main"]'
          ),
        (cy) =>
          cy.get('.mdc-button--outlined[data-testid="btn-auth"]'),
        (cy) =>
          cy.get(
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
        (cy) => cy.get("div#root"),
        (cy) =>
          cy.waitForSelector(
            '.mdc-button--unelevated[data-testid="btn-auth"]'
          ),
        (cy) =>
          cy.get('.mdc-button--outlined[data-testid="btn-main"]'),
        (cy) =>
          cy.get(
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
        (cy) => cy.get("div#root"),
        (cy) =>
          cy.get(
            '.mdc-button--unelevated[data-testid="btn-signup"]'
          ),
        (cy) =>
          cy.get('.mdc-button--outlined[data-testid="btn-auth"]'),
        (cy) =>
          cy.get(
            '.mdc-button--outlined[data-testid="btn-main"]'
          ),
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

test(configuration);
