import { createModel } from "@xstate/test";
import { TestPlan } from "@xstate/test/lib/types";
import { chain } from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/function";
import * as d from "io-ts/lib/Decoder";
import { createMachine, State } from "xstate";
import { Deferred } from "./delay";

export type Delay = ["delay" | "wait" | "...", number];
export type TestContextFunction<TTestContext> = (
  testContext: TTestContext
) => unknown;
export type WaitForSelector = ["$" | "waitForSelector", string | string[]];
export type WaitForFocus = ["waitForFocus" | "$:focus", string];
export type Click = ["click", string | string[]];
export type Defer = ["defer", string | string[]];
export type Resolve = ["resolve", string | string[]];
export type Type = ["type", string, number | string];
export type Select = ["select", string, number | string | (number | string)[]];
export type ExpectProperty = [
  "expectProperty" | "prop" | ".",
  string,
  string,
  number | boolean | string
];

export type Instruction<TTestContext> =
  | Delay
  | TestContextFunction<TTestContext>
  | WaitForSelector
  | WaitForFocus
  | Click
  | Defer
  | Resolve
  | Type
  | Select
  | ExpectProperty;

export type Configuration<TTestContext> = {
  id: string;
  visit: {
    port?: number;
    server?: string;
    path: string;
  };
  apis?: {
    path: string;
    status?: number;
    body?: any;
    deferrals?: string[];
    outcomes?: {
      [event: string]: {
        status?: number;
        body?: any;
      };
    };
  }[];
  viewport?: {
    width: number;
    height: number;
  };
  beforeVisit?: TestContextFunction<TTestContext> | Instruction<TTestContext>[];
  initial: string;
  states: {
    [state: string]: {
      type?: "final";
      tests?: TestContextFunction<TTestContext> | Instruction<TTestContext>[];
      on?: {
        [event: string]:
          | TestContextFunction<TTestContext>
          | Instruction<TTestContext>[]
          | {
              target?: string;
              actions?:
                | TestContextFunction<TTestContext>
                | Instruction<TTestContext>[];
            };
      };
    };
  };
};

const pageFnDecoder = <TTestContext>(): d.Decoder<
  unknown,
  TestContextFunction<TTestContext>
> => ({
  decode: (fn) =>
    typeof fn === "function"
      ? d.success(fn as TestContextFunction<TTestContext>)
      : d.failure(fn, "is not a function"),
});

const decoderDelay: d.Decoder<unknown, Delay> = d.tuple(
  d.union(d.literal("delay"), d.literal("wait"), d.literal("...")),
  d.number
);

const decoderResolve: d.Decoder<unknown, Resolve> = d.tuple(
  d.literal("resolve"),
  d.union(d.string, d.array(d.string))
);

const decoderWaitForFocus: d.Decoder<unknown, WaitForFocus> = d.tuple(
  d.union(d.literal("waitForFocus"), d.literal("$:focus")),
  d.string
);

const decoderExpectProperty: d.Decoder<unknown, ExpectProperty> = d.tuple(
  d.union(d.literal("expectProperty"), d.literal("prop"), d.literal(".")),
  d.string,
  d.string,
  d.union(d.number, d.string, d.boolean)
);

const decoderSelect: d.Decoder<unknown, Select> = d.tuple(
  d.literal("select"),
  d.string,
  d.union(d.string, d.number, d.array(d.union(d.string, d.number)))
);

const decoderType: d.Decoder<unknown, Type> = d.tuple(
  d.literal("type"),
  d.string,
  d.union(d.string, d.number)
);

const decoderWaitForSelector: d.Decoder<unknown, WaitForSelector> = d.tuple(
  d.union(d.literal("waitForSelector"), d.literal("$")),
  d.union(d.string, d.array(d.string))
);

const decoderClick: d.Decoder<unknown, Click> = d.tuple(
  d.literal("click"),
  d.union(d.string, d.array(d.string))
);

const decoderDefer: d.Decoder<unknown, Defer> = d.tuple(
  d.literal("defer"),
  d.union(d.string, d.array(d.string))
);

const actionDecoder = <TTestContext>(): d.Decoder<
  unknown,
  Instruction<TTestContext>
> =>
  d.union(
    decoderDelay,
    pageFnDecoder<TTestContext>(),
    decoderResolve,
    decoderWaitForFocus,
    decoderExpectProperty,
    decoderDefer,
    decoderClick,
    decoderWaitForSelector,
    decoderSelect,
    decoderType
  );

const valueDecoder = d.nullable(d.union(d.string, d.number, d.boolean));

const jsonDecoder: d.Decoder<unknown, any> = d.lazy("JSON", () =>
  d.union(valueDecoder, d.array(jsonDecoder), d.record(jsonDecoder))
);

// const configDecoder = <TTestContext>() => {
const configDecoder = <TTestContext>(): d.Decoder<
  unknown,
  Configuration<TTestContext>
> => {
  const decoderInstructions = d.union(
    pageFnDecoder<TTestContext>(),
    d.array(actionDecoder<TTestContext>())
  );

  return d.intersect(
    d.partial({
      beforeVisit: decoderInstructions,
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
      viewport: d.type({
        width: d.number,
        height: d.number,
      }),
    })
  )(
    d.type({
      id: d.string,
      visit: d.intersect(d.type({ path: d.string }))(
        d.partial({
          port: d.number,
          server: d.string,
        })
      ),
      initial: d.string,
      states: d.record(
        d.partial({
          type: d.literal("final"),
          tests: decoderInstructions,
          on: d.record(
            d.union(
              decoderInstructions,
              d.partial({
                target: d.string,
                actions: decoderInstructions,
              })
            )
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

export type Action<TTestContext> = Instruction<TTestContext>;

export default <TTestContext>(json: any) =>
  configDecoder<TTestContext>().decode(json);

const defaultSelectorWrapper = (selector: string) =>
  `[data-testid~="${selector}"]`;

const defaultPorts = {
  ci: 7777,
  prod: 7777,
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
    actions: Instruction<TTestContext>[]
  ) => (testContext: TTestContext) => Promise<any>
) => (
  withPlans: (setup: {
    buffer: Deferred<any>[];
    config: Configuration<TTestContext>;
    outcomes: string[];
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

  return (configuration: Configuration<TTestContext>) => {
    const eitherConfig = configDecoder<TTestContext>().decode(configuration);

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
          exec: (testContext: TTestContext) => any;
        }
      > = {};

      Object.keys(config.states).forEach((state) => {
        const { type, tests, on: events = {} } = config.states[state];

        const meta = tests && {
          test: (testContext: TTestContext, _state: State<any, any>) => {
            return typeof tests === "function"
              ? tests(testContext)
              : actionsParser(selectorWrapper)(buffer)(tests)(testContext);
          },
        };

        const on = Object.keys(events || {}).reduce((acc, eventType) => {
          const event = events[eventType];

          const actions: Instruction<TTestContext>[] =
            typeof event === "function"
              ? [event]
              : Array.isArray(event)
              ? event
              : !event.actions
              ? []
              : typeof event.actions === "function"
              ? [event.actions]
              : event.actions;

          const target =
            typeof event !== "function" && !Array.isArray(event)
              ? event.target
              : undefined;

          acc[eventType] = target
            ? {
                target,
              }
            : {};

          eventMap[eventType] = {
            exec: (testContext) =>
              actionsParser(selectorWrapper)(buffer)(actions)(testContext),
          };

          return acc;
        }, {} as any);

        const stateNode = Object.assign({
          meta,
          on,
          type,
        });

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

      const outcomes = pipe(
        config.apis || [],
        chain((api) => Object.keys(api.outcomes || {}))
      );

      withPlans({
        plans,
        buffer,
        pattern,
        url,
        config,
        outcomes,
        selectorWrapper,
      });
    }
  };
};
