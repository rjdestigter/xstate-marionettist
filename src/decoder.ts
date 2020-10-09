import * as d from "io-ts/lib/Decoder";
import { Page } from "puppeteer";

export const string: d.Decoder<unknown, string> = {
  decode: (u) =>
    typeof u === "string" ? d.success(u) : d.failure(u, "string"),
};

const pageFnDecoder: d.Decoder<unknown, (page: Page) => unknown | Promise<unknown>> = {
  decode: (fn) =>
    typeof fn === "function"
      ? d.success(fn as (page: Page) => unknown | Promise<unknown>)
      : d.failure(fn, "Function: (page: Page) => any"),
};

const actionDecoder = d.union(
  d.tuple(d.literal("delay"), d.number),
  pageFnDecoder,
  d.tuple(
    d.union(d.literal("resolve"), d.literal("waitForFocus")),
    d.string,
  ),
  d.tuple(
    d.union(
      d.literal("waitForSelector"),
      d.literal("$"),
      d.literal("click"),
      d.literal("defer"),
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

const configDecoder = d.intersect(
  d.partial({
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
        tests: d.array(actionDecoder),
        on: d.record(
          d.partial({
            target: d.string,
            actions: d.array(actionDecoder),
          })
        ),
      })
    ),
  })
);

export type Action = d.TypeOf<typeof actionDecoder>;

export type Configuration = d.TypeOf<typeof configDecoder>;

export default (json: any) => configDecoder.decode(json);
