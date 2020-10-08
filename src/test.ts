import * as E from "fp-ts/lib/Either";
import { createMachine } from "xstate";
import { createModel } from "@xstate/test";
import { Page } from "puppeteer";
import debug from "debug";

import delay, { defer, Deferred } from "./delay";

import { makeOnRequest } from "./api";
import { assign } from "xstate";

import decode, {
  Action as TAction,
  Configuration as TConfiguration,
} from "./decoder";

const parseActions = (buffer: Deferred[], debug: (log: any) => void) => (
  actions: TAction[]
) => async (page: Page) => {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    debug(action.join(" -> "));

    switch (action[0]) {
      case "delay": {
        await delay(action[1]);
        break;
      }

      case "click": {
        await page.click(`[data-testid="${action[1]}"]`);
        break;
      }

      case "type": {
        await page.type(`[data-testid="${action[1]}"]`, `${action[2]}`);
        break;
      }

      case "select": {
        await page.select(`[data-testid="${action[1]}"]`, action[2]);
        break;
      }

      case "defer": {
        const deferred = defer(action[1], action[1]);
        debug(`deferring -> ${deferred.id}`);
        buffer.push(deferred);
        debug(`buffer.length -> ${buffer.length}`);

        break;
      }

      case "resolve": {
        // while (buffer.length > 0) {
        //   const deferred = buffer.shift();
        //   deferred?.resolve();
        // }

        let index = -1;
        do {
          index = buffer.findIndex((deferred) => deferred.id === action[1]);

          if (index >= 0) {
            const deferred = buffer[index];
            debug(`resolving -> ${deferred.id}`);
            buffer.splice(index, 1);
            deferred.resolve();
          }
        } while (false);

        break;
      }

      case "waitForSelector": {
        await page.waitForSelector(`[data-testid="${action[1]}"`);
        break;
      }

      case "waitForFocus": {
        await page.waitForFunction(
          `document.activeElement && document.activeElement.getAttribute("data-testid") === "${action[1]}"`
        );

        break;
      }

      case "expectProperty": {
        const element = await page.waitForSelector(
          `[data-testid="${action[1]}"]`
        );
        const value = await page.evaluate(
          (el, selector) => el[selector],
          element,
          action[2]
        );

        expect(value).toBe(action[3]);

        break;
      }

      case "expectNotSelector": {
        await page.waitForFunction(
          `!document.querySelector("[data-testid='${action[1]}']")`
        );
      }
    }
  }
};

const parseActionsToAssign = (actions: TAction[]) =>
  actions
    .map((action) => {
      switch (action[0]) {
        case "select":
        case "type": {
          return assign({ [action[1]]: () => action[2] });
        }
        default:
          return undefined;
      }
    })
    .filter(_ => !!_);

export default function test(json: any) {
  const configuration = decode(json);

  if (E.isRight(configuration)) {
    const config = configuration.right;

    describe(`Auto-generated: ${config.id}`, () => {
      const debugPlan: (log: any) => void = debug(`e2e:pln:${config.id}`);
      const debugPath: (log: any) => void = debug(`e2e:pth:${config.id}`);
      const debugTest: (log: any) => void = debug(`e2e:tst:${config.id}`);
      const debugEvent: (log: any) => void = debug(`e2e:evt:${config.id}`);

      const machineTemplate: any = {
        id: config.id,
        initial: config.initial,
        states: {},
        context: {},
      };

      const eventMap: Record<
        string,
        {
          exec: (page: Page) => any;
        }
      > = {};

      Object.keys(config.states).forEach((state) => {
        const { type, tests, on: events = {}, xstate = {} } = config.states[
          state
        ];

        const meta = tests && {
          test: async (page: Page) => {
            debugTest(`state: ${state}`);
            return parseActions(buffer, debugTest)(tests)(page);
          },
        };

        const on = Object.keys(events || {}).reduce((acc, next) => {
          const event = events[next];

          acc[next] = {
            target: event.target,
            actions: parseActionsToAssign(event.actions || []),
          };

          if (event.actions) {
            const actions = event.actions;

            eventMap[next] = {
              exec: async (page) => {
                debugEvent(`${next}`);
                return parseActions(buffer, debugEvent)(actions)(page);
              },
            };
          } else {
            eventMap[next] = {
              exec: () => true,
            };
          }

          return acc;
        }, {} as any);

        const stateNode = Object.assign(
          {
            meta,
            on,
            type,
          },
          xstate
        );

        machineTemplate.states[state] = stateNode;
      });

      const machine = createMachine(machineTemplate);

      const buffer: Deferred[] = [];
      const failurePattern: string[][][] = [];

      const onRequest = makeOnRequest(
        config.id,
        failurePattern,
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

      const model = createModel<Page>(machine).withEvents(eventMap);
      const testPlans = model.getShortestPathPlans();
      testPlans.reverse();

      testPlans.forEach((plan, planIndex) => {
        //
        failurePattern[planIndex] = [];

        describe(`${planIndex}: ${plan.description}`, () => {
          //
          plan.paths.forEach((path, pathIndex) => {
            //
            failurePattern[planIndex][pathIndex] =
              // path.description.match(/OK|BAD/g) || [];
              config.outcomes
                ? path.description.match(
                    new RegExp(config.outcomes.join("|"), "g")
                  ) || []
                : [];

            const outcomes = failurePattern[planIndex][pathIndex];

            it(`${pathIndex}: (${outcomes.join(", ")}) ${
              path.description
            }`, async () => {
              debugPlan("-------------");
              debugPlan(planIndex);
              debugPlan(plan.description);
              debugPath(pathIndex);
              debugPath(path.description);
              debugPath(outcomes.join(", "));

              if (config.viewport) await page.setViewport(config.viewport);

              await page.goto(
                `http://localhost:${process.env.E3E ? 3000 : 7777}${
                  config.visit.path
                }?mockCaptcha=mock-captcha-value&inspect=false&pathIndex=${pathIndex}&planIndex=${planIndex}&outcomes=${outcomes.join(
                  ","
                )}`
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

      it("coverage", () => {
        model.testCoverage({
          filter: (node) => !!node.meta,
        });
      });
    });
  } else {
    console.log(JSON.stringify(configuration, null, 2));

    describe(`Failed to generate automated end-2-end test for ${json.name}`, () => {
      it("Failed to decode configuration", () => {
        expect(false).toBe(configuration.left);
      });
    });
  }
}

export type Action = TAction;
export type Configuration = TConfiguration;
