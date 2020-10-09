// Modules

import { Request } from "puppeteer";
import debug from "debug";
import { Deferred } from "./delay";

import { Configuration } from "./decoder";

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
  const debugValue = debug(`e2e:val:${id}`);
  const debugReq = debug(`e2e:req:${id}`);

  return async (interceptedRequest: Request): Promise<void> => {
    const frameUrl = interceptedRequest.frame()?.url() || "";
    const url = interceptedRequest.url();

    // if (apiRx.test(url)) {
    const matchingApi = apis.find((api) =>
      new RegExp(api.path).test(interceptedRequest.url())
    );

    if (
      interceptedRequest.method() !== "OPTIONS" &&
      matchingApi?.deferrals != null
    ) {
      debugReq(`BUF ► LENGTH ► ${interceptedRequest.url()}`);
      debugReq(`BUF ► LENGTH ► ${buffer.length}`);

      const deferrals = buffer.filter((deferred) =>
        matchingApi.deferrals!.includes(deferred.id)
      );
      while (deferrals.length > 0) {
        const deferred = deferrals[0];

        if (deferred) {
          debugReq(`BUF ► WAIT ► ${deferred.id}`);
          debugReq(`BUF ► WAIT ► ${interceptedRequest.method()}`);
          debugReq(`BUF ► WAIT ► ${interceptedRequest.url()}`);

          const result = await deferred;
          deferrals.shift();
          debugReq(`BUF ► RESOLVED ► ${result}`);
          debugReq(`BUF ► RESOLVED ► ${interceptedRequest.method()}`);
          debugReq(`BUF ► RESOLVED ► ${interceptedRequest.url()}`);
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

      debugReq(`REQ ► ${interceptedRequest.method()} ► ${url}`);

      const [, pathIndex, planIndex] = (frameUrl.match(/\d+/g) || []).map(
        Number
      );

      const outcome = failurePattern[planIndex][pathIndex].shift() || "*";

      const apiOutcome = matchingApi?.outcomes
        ? matchingApi?.outcomes[outcome] || matchingApi?.outcomes["*"]
        : undefined;

      if (apiOutcome) {
        if (apiOutcome.status === -1) {
          debugValue(`REQ ► Aborted`);
          return interceptedRequest.abort();
        }

        return interceptedRequest.respond({
          status: apiOutcome.status || 200,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(apiOutcome.body || {}),
        });
      }

      return interceptedRequest.respond({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({}),
      });
    }

    return interceptedRequest.continue();
  };
};
