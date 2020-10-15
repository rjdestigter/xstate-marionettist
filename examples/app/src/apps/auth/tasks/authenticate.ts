import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/pipeable";

type Token = {
  access_token: string,
  refresh_token: string,
}

export const authenticate = (credentials: {
  email?: string;
  password?: string;
}) =>
  pipe(
    T.of({}),
    T.chain(() => async () => {
      try {
        return await fetch('http://localhost:3000/token') // .catch(reason => Promise.reject(reason))
      } catch (error) {
        return Promise.reject(`${error}`)
      }
    }),
    T.chain(
      response => {
        return () =>
          Promise.all([
            Promise.resolve(response.status),
            response.status === 200 ? response.json() : response.text(),
          ]);
      }
    )
  );

export default authenticate;
