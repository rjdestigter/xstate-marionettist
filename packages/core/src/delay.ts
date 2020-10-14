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
