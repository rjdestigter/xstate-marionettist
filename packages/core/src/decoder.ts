import { createModel } from "@xstate/test";
import { TestPlan } from "@xstate/test/lib/types";
import * as d from "io-ts/lib/Decoder";
import { createMachine, State } from "xstate";
import { Deferred } from "./delay";

const pageFnDecoder = <TTestContext>(): d.Decoder<
  unknown,
  (page: TTestContext) => unknown | Promise<unknown>
> => ({
  decode: (fn) =>
    typeof fn === "function"
      ? d.success(fn as (page: TTestContext) => unknown | Promise<unknown>)
      : d.failure(fn, "Function: (page: Page) => any"),
});

const actionDecoder = <TTestContext>() =>
  d.union(
    d.tuple(d.literal("delay"), d.number),
    pageFnDecoder<TTestContext>(),
    d.tuple(d.union(d.literal("resolve"), d.literal("waitForFocus")), d.string),
    d.tuple(
      d.union(
        d.literal("waitForSelector"),
        d.literal("$"),
        d.literal("click"),
        d.literal("defer")
      ),
      d.union(d.string, d.array(d.string))
    ),
    d.tuple(d.literal("type"), d.string, d.union(d.number, d.string)),
    d.tuple(d.literal("select"), d.string, d.string),
    d.tuple(
      d.literal("expectProperty"),
      d.string,
      d.string,
      d.union(d.number, d.boolean, d.string)
    )
  );
const valueDecoder = d.nullable(d.union(d.string, d.number, d.boolean));

const jsonDecoder: d.Decoder<unknown, any> = d.lazy("JSON", () =>
  d.union(valueDecoder, d.array(jsonDecoder), d.record(jsonDecoder))
);

const configDecoder = <TTestContext>() => {
  const actionD = d.array(actionDecoder<TTestContext>());

  return d.intersect(
    d.partial({
      beforeVisit: actionD,
      apis: d.array(
        d.intersect(d.type({ path: d.string }))(
          d.partial({
            deferrals: d.array(d.string),
            outcomes: d.record(
              d.partial({
                status: d.number,
                body: jsonDecoder,
              })
            ),
          })
        )
      ),
      outcomes: d.array(d.string),
      viewport: d.type({
        width: d.number,
        height: d.number,
      }),
    })
  )(
    d.type({
      id: d.string,
      visit: d.type({ path: d.string }),
      initial: d.string,
      states: d.record(
        d.partial({
          xstate: d.partial({
            always: d.string,
          }),
          type: d.literal("final"),
          tests: actionD,
          on: d.record(
            d.partial({
              target: d.string,
              actions: actionD,
            })
          ),
        })
      ),
    })
  );
};

const bar = configDecoder<22>();

class _<T> {
  Action = actionDecoder<T>();
  Configuration = configDecoder<T>();
}

export type Action<TTestContext> = d.TypeOf<_<TTestContext>["Action"]>;
export type Configuration<TTestContext> = d.TypeOf<
  _<TTestContext>["Configuration"]
>;

export default <TTestContext>(json: any) =>
  configDecoder<TTestContext>().decode(json);

const defaultSelectorWrapper = (selector: string) =>
  `[data-testid~="${selector}"]`;

const defaultPorts = {
  ci: 9999,
  prod: 9999,
  dev: 3000,
};

type Options = {
  selectorWrapper?: (selector: string) => string;
  server?: string;
  xstateInspect?: boolean;
  ports?: {
    ci?: number;
    prod?: number;
    dev?: number;
  };
};

export const make = <TTestContext>(
  actionsParser: (
    selectorWrapper: typeof defaultSelectorWrapper
  ) => (
    buffer: Deferred[]
  ) => (
    actions: Action<TTestContext>[]
  ) => (testContext: TTestContext) => Promise<any>
) => (
  withPlans: (setup: {
    buffer: Deferred<any>[];
    config: Configuration<TTestContext>;
    pattern: string[][][];
    plans: TestPlan<TTestContext, unknown>[];
    url: string;
    selectorWrapper: typeof defaultSelectorWrapper;
  }) => void
) => (
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
) => {
  const ports = { ...defaultPorts, ...ports_ };
  const ci = process.env.CI === "true";
  const prod = process.env.NODE_ENV === "production";
  const port =
    ci && ports.ci ? ports.ci : ci || prod ? ports.ci || ports.prod : ports.dev;

  return (json: any) => {
    const eitherConfig = configDecoder<TTestContext>().decode(json);

    if (eitherConfig._tag === "Right") {
      const config = eitherConfig.right;

      const machineTemplate: any = {
        id: config.id,
        initial: config.initial,
        states: {},
        describe: {},
      };

      const eventMap: Record<
        string,
        {
          exec: (cy: TTestContext) => any;
        }
      > = {};

      Object.keys(config.states).forEach((state) => {
        const { type, tests, on: events = {}, xstate = {} } = config.states[
          state
        ];

        const meta = tests && {
          test: (cy: TTestContext, state: State<any, any>) => {
            return actionsParser(selectorWrapper)(buffer)(
              tests as Action<TTestContext>[]
            )(cy);
          },
        };

        const on = Object.keys(events || {}).reduce((acc, next) => {
          const event = events[next];

          acc[next] = {
            target: event.target,
            actions: [] as Action<TTestContext>[],
          };

          if (event.actions) {
            const actions = event.actions;

            eventMap[next] = {
              exec: (cy) =>
                actionsParser(selectorWrapper)(buffer)(
                  actions as Action<TTestContext>[]
                )(cy),
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
      const pattern: string[][][] = [];

      const model = createModel<TTestContext>(machine).withEvents(eventMap);
      const plans = model.getSimplePathPlans();

      const visitPath = /^\//.test(config.visit.path)
        ? config.visit.path
        : `/${config.visit.path}`;

      const q = /\?/.test(visitPath) ? "&" : "?";

      const url = `${server}:${port}${visitPath}${q}xstate-inspect=${xstateInspect}`;

      withPlans({ plans, buffer, pattern, url, config, selectorWrapper });
    }
  };
};
