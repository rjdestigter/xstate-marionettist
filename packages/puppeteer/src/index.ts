import { Page } from "puppeteer";
import debug from "debug";
import { Action, defer, delay, Deferred, make } from "xstate-marionettist";
import { makeOnRequest } from "./api";

declare const page: Page
const logaction = debug("marionettist:action");

const parseActions = (wrap: (str: string) => string) => (
  buffer: Deferred[]
) => (actions: Action<Page>[]) => async (page: Page) => {
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
        await page.select(wrap(action[1]), action[2]);
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
        const element = await page.waitForSelector(wrap(action[1]));

        const value = await page.evaluate(
          (el, selector) => el[selector],
          element,
          action[2]
        );

        expect(value).toBe(action[3]);

        break;
      }
    }
  }
};

export const create = make(parseActions)(
  ({ buffer, pattern, plans, config, url, selectorWrapper }) => {
    describe(`xstate-marionettist-puppeteer (${config.id})`, () => {
      const onRequest = makeOnRequest(
        config.id,
        pattern,
        buffer,
        config.apis || []
      );

      beforeAll(async () => {
        await page.setRequestInterception(true);
        page.on("request", onRequest);
      });

      afterAll(async () => {
        page.off("request", onRequest);
        await page.setRequestInterception(false);
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
              config.outcomes
                ? path.description.match(
                    new RegExp(config.outcomes.join("|"), "g")
                  ) || []
                : [];

            const outcomes = pattern[planIndex][pathIndex];

            it(`${pathIndex}: (${outcomes.join(", ")}) ${
              path.description
            }`, async () => {
              if (config.viewport) await page.setViewport(config.viewport);

              if (config.beforeVisit) {
                await parseActions(selectorWrapper)(buffer)(
                  config.beforeVisit as Action<Page>[]
                )(page);
              }

              await page.goto(url);

              await page.waitForSelector("body");

              await page.evaluate(
                `document.body.setAttribute("data-marionettist-path-index", ${pathIndex})`
              );

              await page.evaluate(
                `document.body.setAttribute("data-marionettist-plan-index", ${planIndex})`
              );

              await path.test(page);

              while (buffer.length > 0) {
                const deferred = buffer.shift();
                deferred?.resolve();
              }
            }, 60000);
          });
        });
      });
    });
  }
);

export default create()