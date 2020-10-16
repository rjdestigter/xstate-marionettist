/// <reference types="cypress" />

import { Action, defer, Deferred, delay, make } from "xstate-marionettist";

type TestContext = typeof cy;

const parseActions = (wrap: (str: string) => string) => (
  buffer: Deferred[]
) => (actions: Action<TestContext>[]) => (cy: TestContext) =>
  new Promise((resolve) => {
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
          const names = Array.isArray(action[1]) ? action[1] : [action[1]];

          names.forEach((_) => {
            const deferred = defer(_, _);
            buffer.push(deferred);
            cy.log(`Defer: ${deferred.id}`);
          });

          break;
        }

        case "resolve": {
          let index = -1;
          do {
            index = buffer.findIndex((deferred) => deferred.id === action[1]);

            if (index >= 0) {
              const deferred = buffer[index];
              buffer.splice(index, 1);
              cy.log(`Resolve: ${deferred.id}`);
              deferred.resolve();
              cy.log(`Resolved: ${deferred.id}`);
            }
          } while (false);

          cy.wrap(() => new Promise((resolve) => setTimeout(resolve, 1)));
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

    cy.then(resolve);
  });

export const create = make(parseActions)(
  ({
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
              config.apis?.forEach((api) => {
                cy.route2(
                  {
                    path: new RegExp(api.path),
                  },
                  async (req) => {
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

                    while (deferrals.length > 0) {
                      const deferred = deferrals[0];

                      if (deferred) {
                        await Promise.race([deferred, delay(1500)]);
                        deferrals.shift();
                      }
                    }

                    const apiOutcome =
                      api.outcomes?.[outcome] || api.outcomes?.["*"];

                    if (apiOutcome) {
                      if (apiOutcome.status === -1) {
                        return req.destroy();
                      }

                      return req.reply(
                        apiOutcome.status || 200,
                        apiOutcome.body || {}
                      );
                    }

                    return req.reply(200, {});
                  }
                ).as(api.deferrals?.[0] || "");
              });

              const beforeVisit = !config.beforeVisit
                ? []
                : typeof config.beforeVisit === "function"
                ? [config.beforeVisit]
                : config.beforeVisit;

              parseActions(selectorWrapper)(buffer)(beforeVisit)(cy);

              return cy.visit(url).then(() => {
                path.test(cy).then(() => {
                  buffer.splice(0, buffer.length);
                });

                cy.wait(50);
              });
            });
          });
        });
      });
    });
  }
);

export default create();
