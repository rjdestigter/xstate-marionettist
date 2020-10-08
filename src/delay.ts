/**
 * @packageDocumentation
 * @module utils
 */

/**
 * ```hs
 * delay :: number -> Promise ()
 * ```
 *
 * Creates a promise that resolves after n milliseconds. Defaults to 1s.
 *
 * @param ms Milliseconds to delay the promise by. Defaults to 1s.
 * @returns A promise
 */
export const delay = (milliseconds = 1000) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export type Deferred<T = any> = Promise<T> & {
  id: string;
  resolve: () => void;
};

export const defer = <T = any>(value: T, id: string): Deferred<T> => {
  let resolve: () => void = () => {
    throw Error("Unexpected deferral");
  };

  const promise = new Promise<T>((r) => {
    resolve = () => r(value);
  });

  return Object.assign(promise, { resolve, id });
};
export default delay;
