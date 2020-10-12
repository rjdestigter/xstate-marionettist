import * as E from "fp-ts/lib/Either";
import { createMachine } from "xstate";
import { createModel } from "@xstate/test";
import { Page, Route } from "playwright";
import debug from "debug";

import delay, { defer, Deferred } from "./delay";

import { assign } from "xstate";

import decode, {
  Action as TAction,
  Configuration as TConfiguration,
} from "./decoder";

declare const page: Page;

const parseActions = (wrap: (str: string) => string) => (
  buffer: Deferred[],
  debug: (log: any) => void
) => (actions: TAction<Page>[]) => async (page: Page) => {
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (typeof action === "function") {
      debug("pagefunction");
      await action(page);
      continue;
    }

    debug(action.join(" -> "));

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
        await page.selectOption(wrap(action[1]), action[2]);
        break;
      }

      case "defer": {
        const names = Array.isArray(action[1]) ? action[1] : [action[1]];
        await Promise.all(
          names.map((_) => {
            const deferred = defer(_, _);
            debug(`deferring -> ${deferred.id}`);
            buffer.push(deferred);
            debug(`buffer.length -> ${buffer.length}`);
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
            debug(`resolving -> ${deferred.id}`);
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
        debug(`waitForFocus -> ${fn}`);
        await page.waitForFunction(fn);

        break;
      }

      case "expectProperty": {
        const element = await page.waitForSelector(wrap(action[1]), {
          state: 'attached'
        });
        debug(`expectProperty -> element -> ${!!element}`);

        const value = await page.evaluate<any, [typeof element, string]>(
          ([el, selector]) => el[selector as keyof typeof el],
          [element, action[2]]
        );

        debug(`expectProperty -> value -> ${value}`);

        expect(value).toBe(action[3]);

        break;
      }
    }
  }
};

const parseActionsToAssign = (actions: TAction<Page>[]) =>
  actions
    .map((action) => {
      if (typeof action === "function") {
        return undefined;
      }

      switch (action[0]) {
        case "select":
        case "type": {
          return assign({ [action[1]]: () => action[2] });
        }
        default:
          return undefined;
      }
    })
    .filter((_) => !!_);

const defaultSelectorWrapper = (selector: string) =>
  `[data-testid~="${selector}"]`;

const defaultPorts = {
  ci: 9999,
  prod: 9999,
  dev: 3000,
};

export type Options = {
  selectorWrapper?: (selector: string) => string;
  server?: string;
  xstateInspect?: boolean;
  ports?: {
    ci?: number;
    prod?: number;
    dev?: number;
  };
};

export function make(
  {
    selectorWrapper = defaultSelectorWrapper,
    ports: ports_ = defaultPorts,
    server = "http://localhost",
    xstateInspect = false,
  }: Options = {
    selectorWrapper: defaultSelectorWrapper,
    ports: defaultPorts,
    server: "http://localhost",
    xstateInspect: false,
  }
) {
  const ports = { ...defaultPorts, ...ports_ };
  const ci = process.env.CI === "true";
  const prod = process.env.NODE_ENV === "production";
  const port =
    ci && ports.ci ? ports.ci : ci || prod ? ports.ci || ports.prod : ports.dev;

  return (json: any) => {
    const configuration = decode<Page>(json);

    if (E.isRight(configuration)) {
      const config = configuration.right;

      describe(`Auto-generated: ${config.id}`, () => {
        const debugPlan = (...args: any[]) =>
          debug(`e2e(${config.id}): ► PLAN`)(args.join(" ► "));
        const debugPath = (...args: any[]) =>
          debug(`e2e(${config.id}): ► PATH`)(args.join(" ► "));
        const debugTest = (...args: any[]) =>
          debug(`e2e(${config.id}): ► TEST`)(args.join(" ► "));
        const debugEvent = (...args: any[]) =>
          debug(`e2e(${config.id}): ► EVENT`)(args.join(" ► "));
        const debugRoute = (...args: any[]) =>
          debug(`e2e(${config.id}): ► ROUTE`)(args.join(" ► "));

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
              return parseActions(selectorWrapper)(buffer, debugTest)(
                tests as TAction<Page>[]
              )(page);
            },
          };

          const on = Object.keys(events || {}).reduce((acc, next) => {
            const event = events[next];

            acc[next] = {
              target: event.target,
              actions: parseActionsToAssign(
                (event.actions as TAction<Page>[]) || []
              ),
            };

            if (event.actions) {
              const actions = event.actions;

              eventMap[next] = {
                exec: async (page) => {
                  debugEvent(`${next}`);
                  return parseActions(selectorWrapper)(buffer, debugEvent)(
                    actions as TAction<Page>[]
                  )(page);
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

        const routers = config.apis?.map((api) => {
          debugRoute("SETUP", api.path)
          return [
            `**${api.path}`,
            async (route: Route) => {
              debugRoute("INTERCEPT", api.path);


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

              debugRoute("PATH", api.path, pathIndex);
              debugRoute("PLAN", api.path, planIndex);


              const outcomeIndex = failurePattern[planIndex][
                pathIndex
              ].findIndex((outcome) => !!api.outcomes?.[outcome]);

              const outcome =
                failurePattern[planIndex][pathIndex][outcomeIndex] || "*";

              debugRoute("OUTCOME", api.path, outcome);

              outcomeIndex >= 0 &&
                failurePattern[planIndex][pathIndex].splice(outcomeIndex, 1);

              const deferrals = buffer.filter((deferred) =>
                api.deferrals?.includes(deferred.id)
              );

              while (deferrals.length > 0) {
                const deferred = deferrals[0];

                if (deferred) {
                  debugRoute("WAIT", api.path, deferred.id);
                  await deferred;
                  deferrals.shift();
                  debugRoute("CONT", api.path, deferred.id);
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

        beforeAll(async () => {
          await Promise.all([routers?.map(([path, cb]) => {
            debugRoute("BEFORE", path)
            return page.route(path, cb);
          })]);
        });

        afterAll(async () => {
          await Promise.all([routers?.map(([path, cb]) => {
            debugRoute("AFTER", path);
            return page.unroute(path, cb);
          })]);
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

                // if (config.viewport) await page.setViewport(config.viewport);

                if (config.beforVisit) {
                  await parseActions(selectorWrapper)(buffer, debugEvent)(
                    config.beforVisit as TAction<Page>[]
                  )(page);
                }

                const visitPath = /^\//.test(config.visit.path)
                  ? config.visit.path
                  : `/${config.visit.path}`;

                const q = /\?/.test(visitPath) ? "&" : "?";

                const url = `${server}:${port}${visitPath}${q}xstate-inspect=${xstateInspect}&pathIndex=${pathIndex}&planIndex=${planIndex}&outcomes=${outcomes.join(
                  ","
                )}`;

                debugPath(url);

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
  };
}

export type Action = TAction;
export type Configuration = TConfiguration;

export default make();
