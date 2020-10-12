import * as d from "io-ts/lib/Decoder";
import { Page } from "puppeteer";

const pageFnDecoder = <TPage>(): d.Decoder<
  unknown,
  (page: TPage) => unknown | Promise<unknown>
> => ({
  decode: (fn) =>
    typeof fn === "function"
      ? d.success(fn as (page: TPage) => unknown | Promise<unknown>)
      : d.failure(fn, "Function: (page: Page) => any"),
});

const actionDecoder = <TPage>() =>
  d.union(
    d.tuple(d.literal("delay"), d.number),
    pageFnDecoder<TPage>(),
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

const configDecoder = <TPage>() => {
  const actionD = d.array(actionDecoder<TPage>());

  return d.intersect(
    d.partial({
      beforVisit: actionD,
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

export type Action<P = Page> = d.TypeOf<_<P>["Action"]>;
export type Configuration<P = Page> = d.TypeOf<_<P>["Configuration"]>;

export default <TPage>(json: any) => configDecoder<TPage>().decode(json);
