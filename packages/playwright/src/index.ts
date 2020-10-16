import { ChromiumBrowserContext, Page, Route } from "playwright";
import debug from "debug";

import { Action, defer, delay, Deferred, make } from "xstate-marionettist";

type TestContext = Page;

declare const page: Page;
declare const context: ChromiumBrowserContext;

const logaction = debug("marionettist(pw):action");

const parseActions = (wrap: (str: string) => string) => (
  buffer: Deferred[]
) => (actions: Action<TestContext>[]) => async (page: TestContext) => {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (typeof action === "function") {
      logaction("pagefunction");
      await action(page);
      continue;
    }

    logaction(action.join(" -> "));

    switch (action[0]) {
      case "delay": {
        await delay(action[1]);
        break;
      }

      case "click": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        await Promise.all(names.map((_) => page.click(wrap(_))));
        break;
      }

      case "type": {
        await page.type(wrap(action[1]), `${action[2]}`);
        break;
      }

      case "select": {
        await page.selectOption(wrap(action[1]), "" + action[2]);
        break;
      }

      case "defer": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        await Promise.all(
          names.map((_) => {
            const deferred = defer(_, _);
            logaction(`deferring -> ${deferred.id}`);
            buffer.push(deferred);
            logaction(`buffer.length -> ${buffer.length}`);
          })
        );

        break;
      }

      case "resolve": {
        let index = -1;
        do {
          index = buffer.findIndex((deferred) => deferred.id === action[1]);

          if (index >= 0) {
            const deferred = buffer[index];
            logaction(`resolving -> ${deferred.id}`);
            buffer.splice(index, 1);
            deferred.resolve();
          }
        } while (false);

        break;
      }

      case "waitForSelector": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        await Promise.all(names.map((_) => page.waitForSelector(wrap(_))));
        break;
      }

      case "waitForFocus": {
        const fn = `!!document.activeElement && document.activeElement === document.querySelector("${wrap(
          action[1]
        ).replace(/"/g, '\\"')}")`;
        logaction(`waitForFocus -> ${fn}`);
        await page.waitForFunction(fn);

        break;
      }

      case "expectProperty": {
        const element = await page.waitForSelector(wrap(action[1]), {
          state: "attached",
        });
        logaction(`expectProperty -> element -> ${!!element}`);

        const value = await page.evaluate<any, [typeof element, string]>(
          ([el, selector]) => el[selector as keyof typeof el],
          [element, action[2]]
        );

        logaction(`expectProperty -> value -> ${value}`);

        expect(value).toBe(action[3]);

        break;
      }
    }
  }
};

export const create = make(parseActions)(
  ({
    buffer,
    pattern,
    plans,
    config,
    url,
    selectorWrapper,
    outcomes: allOutcomes,
    model,
  }) => {
    const routers = config.apis?.map((api) => {
      return [
        `**${api.path}**`,
        async (route: Route) => {
          const pathIndex = Number(
            await page?.evaluate(
              'document.body.getAttribute("data-marionettist-path-index")'
            )
          );

          const planIndex = Number(
            await page?.evaluate(
              'document.body.getAttribute("data-marionettist-plan-index")'
            )
          );

          const outcomeIndex = pattern[planIndex][pathIndex].findIndex(
            (outcome) => !!api.outcomes?.[outcome]
          );

          const outcome = pattern[planIndex][pathIndex][outcomeIndex] || "*";

          outcomeIndex >= 0 &&
            pattern[planIndex][pathIndex].splice(outcomeIndex, 1);

          const deferrals = buffer.filter((deferred) =>
            api.deferrals?.includes(deferred.id)
          );

          while (deferrals.length > 0) {
            const deferred = deferrals[0];

            if (deferred) {
              await deferred;
              deferrals.shift();
            }
          }

          const apiOutcome = api.outcomes?.[outcome] || api.outcomes?.["*"];

          if (apiOutcome) {
            if (apiOutcome.status === -1) {
              return route.abort();
            }

            const body = JSON.stringify(apiOutcome.body || {});

            return route.fulfill({
              status: apiOutcome.status || 200,
              contentType: "application/json",
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
              body,
            });
          }

          return route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({}),
          });
        },
      ] as const;
    });

    describe(`xstate-marionettist-plawywright (${config.id})`, () => {
      beforeAll(async () => {
        await context.addInitScript(() => {
          navigator.serviceWorker.register = () => new Promise(() => void 0);
        });

        await Promise.all(
          routers?.map(([path, cb]) => page.route(path, cb)) || []
        );
      });

      afterAll(async () => {
        await Promise.all(
          routers?.map(([path, cb]) => page.unroute(path, cb)) || []
        );
      });

      plans.reverse();

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
            }`, async () => {
              // if (config.viewport) await page.setViewport(config.viewport);

              const beforeVisit = !config.beforeVisit
                ? []
                : typeof config.beforeVisit === "function"
                ? [config.beforeVisit]
                : config.beforeVisit;

              await parseActions(selectorWrapper)(buffer)(beforeVisit)(page);

              await page.goto(url);

              await page.waitForSelector("body");

              await page.evaluate(
                `document.body.setAttribute("data-marionettist-path-index", ${pathIndex})`
              );

              await page.evaluate(
                `document.body.setAttribute("data-marionettist-plan-index", ${planIndex})`
              );

              await path.test(page);

              buffer.splice(0, buffer.length);
            }, 60000);
          });
        });
      });

      it("Coverage", () => {
        model.testCoverage();
      });
    });
  }
);

export default create();
