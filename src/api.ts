// Modules

import { Request } from "puppeteer";
import debug from "debug";
import { Deferred } from "./delay";

import { Configuration } from "./decoder";

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
/**
 * Event handler for intercepting network requests during tests.
 *
 * @param interceptedRequest Request object
 */
export const makeOnRequest = (
  id: string,
  failurePattern: string[][][],
  buffer: Deferred[] = [],
  apis: Configuration["apis"] = []
) => {
  return async (interceptedRequest: Request): Promise<void> => {
    const frame = interceptedRequest.frame();
    const url = interceptedRequest.url();

    debug("e2e")(url);

    if (/xstate-inspect/.test(url)) {
      return interceptedRequest.continue();
    }

    const matchingApi = apis.find((api) =>
      new RegExp(escapeRegExp(api.path)).test(url)
    );

    matchingApi && debug("e2e time")("start -> " + matchingApi.path);
    (await matchingApi) && frame?.waitForSelector("body");

    const pathIndex = matchingApi
      ? Number(
          await frame?.evaluate(
            'document.body.getAttribute("data-marionettist-path-index")'
          )
        )
      : -1;

    const planIndex = matchingApi
      ? Number(
          await frame?.evaluate(
            'document.body.getAttribute("data-marionettist-plan-index")'
          )
        )
      : -1;
    matchingApi && debug("e2e time")("start -> " + matchingApi.path);

    const debugReq = (...args: string[]) =>
      debug(
        `e2e(${id}) ► path(${pathIndex}) ► plan(${planIndex}) ► req(${url})`
      )(args.join(" ► "));

    matchingApi && debugReq("API", matchingApi.path);

    let outcome = "*";
    if (matchingApi && interceptedRequest.method() !== "OPTIONS") {
      debugReq("PATTERNS", ...failurePattern[planIndex][pathIndex]);
      debugReq("OUTCOMES", ...Object.keys(matchingApi.outcomes || { "*": {} }));

      const outcomeIndex = failurePattern[planIndex][pathIndex].findIndex(
        (outcome) => !!matchingApi.outcomes?.[outcome]
      );

      outcome = failurePattern[planIndex][pathIndex][outcomeIndex] || "*";

      outcomeIndex >= 0 &&
        failurePattern[planIndex][pathIndex].splice(outcomeIndex, 1);

      debugReq("OUTCOME", outcome);
    }

    if (
      interceptedRequest.method() !== "OPTIONS" &&
      matchingApi?.deferrals != null
    ) {
      debugReq("buffer.length", "" + buffer.length);

      const deferrals = buffer.filter((deferred) =>
        matchingApi.deferrals!.includes(deferred.id)
      );
      while (deferrals.length > 0) {
        const deferred = deferrals[0];

        if (deferred) {
          debugReq("buffer.wait", deferred.id);

          await deferred;
          deferrals.shift();
          debugReq("buffer.resume", deferred.id);
        }
      }
    }

    if (matchingApi) {
      if (interceptedRequest.method() === "OPTIONS") {
        return interceptedRequest.respond({
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
          },
        });
      }

      const apiOutcome =
        matchingApi.outcomes?.[outcome] || matchingApi.outcomes?.["*"];

      if (apiOutcome) {
        if (apiOutcome.status === -1) {
          debugReq("Aborted");
          return interceptedRequest.abort();
        }

        const body = JSON.stringify(apiOutcome.body || {});

        debugReq("response", body);

        return interceptedRequest.respond({
          status: apiOutcome.status || 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body,
        });
      }

      debugReq("response", "{}");

      return interceptedRequest.respond({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({}),
      });
    }

    debugReq("continue");

    return interceptedRequest.continue();
  };
};
