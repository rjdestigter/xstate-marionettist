import { assign, createMachine } from "@xstate/compiled";

import authenticateTask from "./tasks/authenticate";

type Evt<T extends string, P = {}> = { type: T } & P;

type AuthState = {
  email?: string;
  password?: string;
  error?: string;
};

type AuthEvent =
  | Evt<"LOGIN">
  | Evt<"UPDATE_CONTEXT", AuthState>
  | Evt<"done.invoke.authenticate'", { data: unknown }>
  | Evt<"error.platform.authenticate", { data: string }>;

const machine = createMachine<AuthState, AuthEvent, "auth">(
  {
    id: "auth",
    context: {
    },
    initial: 'noop',
    states: {
      noop: {
        on: {
          UPDATE_CONTEXT: {
            actions: "updateContext",
          },
          LOGIN: "authenticating",
        },
      },
      authenticating: {
        entry: 'clearError',
        invoke: {
          id: "authenticate",
          src: "authenticate",
          onDone: "authenticated",
          onError: {
            target: "noop",
            actions: "handleFailure",
          },
        },
      },
      authenticated: {
        entry: "clearCredentials",
      },
    },
  },
  {
    services: {
      authenticate: (ctx) => authenticateTask(ctx)(),
    },
    actions: {
      handleFailure: assign({ error: (_, evt) => evt.data }),
      clearCredentials: assign({
        email: (_) => undefined,
        password: (_) => undefined,
        error: (_) => undefined,
      }),
      clearError: assign({
         error: (_) => undefined,
      }),
      updateContext: assign((_, { type, ...state }) => ({
        ...state,
        error: undefined,
      })),
    },
  }
);

export default machine