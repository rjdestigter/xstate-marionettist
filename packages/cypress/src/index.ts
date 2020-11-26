/// <reference types="cypress" />

import { Action, defer, Deferred, delay, make } from "xstate-marionettist";
import { createModel } from "./xstate-test";

type TestContext = typeof cy;

const parseActions = (wrap: (str: string) => string) => (
  buffer: Deferred[]
) => (actions: Action<TestContext>[]) => (cy: TestContext) => {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (typeof action === "function") {
      action(cy);
      continue;
    }

    switch (action[0]) {
      case "delay": {
        cy.wait(action[1]);
        break;
      }

      case "click": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        names.forEach((_) => cy.get(wrap(_)).click({}));
        break;
      }

      case "type": {
        cy.get(wrap(action[1])).type(`${action[2]}`);
        break;
      }

      case "select": {
        cy.get(action[1]).select("" + action[2]);
        break;
      }

      case "defer": {
        cy.then(() => {
          const names = Array.isArray(action[1]) ? action[1] : [action[1]];

          names.forEach((_) => {
            const deferred = defer(_, _);
            buffer.push(deferred);
            cy.log("Defer", deferred.id);
          });
        });

        break;
      }

      case "resolve": {
        cy.then(() => {
          let index = -1;
          do {
            index = buffer.findIndex((deferred) => deferred.id === action[1]);

            if (index >= 0) {
              const deferred = buffer[index];
              buffer.splice(index, 1);
              cy.log(`Resolve: ${deferred.id}`);
              deferred.resolve();
              cy.log(`Resolved: ${deferred.id}`);
              cy.wrap(delay(150));
            }
          } while (false);

          // cy.wrap(delay(150));
        });

        break;
      }

      case "waitForSelector": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        names.forEach((_) => cy.get(wrap(_)));
        break;
      }

      case "waitForFocus": {
        cy.get(wrap(action[1])).should("have.focus");
        break;
      }

      case "expectProperty": {
        cy.get(wrap(action[1])).should("have.prop", action[2], action[3]);
        break;
      }
    }
  }
};

export const create = make(
  parseActions,
  createModel as any
)(
  ({
    model,
    buffer,
    pattern,
    plans,
    config,
    url,
    selectorWrapper,
    outcomes: allOutcomes,
  }) => {
    describe(`xstate-marionettist-cypress (${config.id})`, () => {
      plans.forEach((plan, planIndex) => {
        //
        pattern[planIndex] = [];

        describe(`${planIndex}: ${plan.description}`, () => {
          //
          plan.paths.forEach((path, pathIndex) => {
            //
            pattern[planIndex][pathIndex] =
              // path.description.match(/OK|BAD/g) || [];
              allOutcomes.length > 0
                ? path.description.match(
                    new RegExp(allOutcomes.join("|"), "g")
                  ) || []
                : [];

            const outcomes = pattern[planIndex][pathIndex];

            it(`${pathIndex}: (${outcomes.join(", ")}) ${
              path.description
            }`, () => {
              const requests: Deferred[] = [];

              config.apis?.forEach((api) => {
                cy.intercept(
                  {
                    path: new RegExp(api.path),
                  },
                  async (req) => {
                    const busy = defer(req.url, req.url);
                    requests.push(busy);

                    const outcomeIndex = pattern[planIndex][
                      pathIndex
                    ].findIndex((outcome) => api.outcomes?.[outcome]);

                    const outcome =
                      pattern[planIndex][pathIndex][outcomeIndex] || "*";

                    outcomeIndex >= 0 &&
                      pattern[planIndex][pathIndex].splice(outcomeIndex, 1);

                    const deferrals = buffer.filter((deferred) =>
                      api.deferrals?.includes(deferred.id)
                    );

                    if (deferrals.length > 0) {
                      while (deferrals.length > 0) {
                        const deferred = deferrals[0];

                        if (deferred) {
                          await deferred;
                          deferrals.shift();
                        }
                      }
                    } else {
                      await delay(10);
                    }
                    const apiOutcome =
                      api.outcomes?.[outcome] || api.outcomes?.["*"];

                    if (apiOutcome) {
                      if (apiOutcome.status === -1) {
                        return req.destroy();
                      }

                      req.reply(
                        apiOutcome.status || 200,
                        apiOutcome.body || {}
                      );

                      busy.resolve();
                      return;
                    }

                    req.reply(200, {});
                    busy.resolve();
                    return;
                  }
                ).as(api.deferrals?.[0] || "");
              });

              const beforeVisit = !config.beforeVisit
                ? []
                : typeof config.beforeVisit === "function"
                ? [config.beforeVisit]
                : config.beforeVisit;

              parseActions(selectorWrapper)(buffer)(beforeVisit)(cy);

              cy.visit(url);
              path.test(cy);
              cy.then(() => {
                buffer.splice(0, buffer.length);
              });

              cy.window().then((win) => {
                win.location.href = "about:blank";
              });
            });
          });
        });
      }); // end foreach

      describe(`Coverage`, () => {
        it("covers all states", () => {
          cy.then(() => {
            model.testCoverage();
          });
        });
      });
    }); // end describe
  }
);

export default create();
