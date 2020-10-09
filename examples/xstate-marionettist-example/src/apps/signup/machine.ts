import { assign, createMachine } from "@xstate/compiled";

import authenticateTask from "./tasks/submit-registration";

type Evt<T extends string, P = {}> = { type: T } & P;

type SignupState = {
  email?: string;
  password?: string;
  repeatPassword?: string;
  name?: string;
  age?: number;
  error?: string;
};

type SignupEvent =
  | Evt<"REGISTER">
  | Evt<"UPDATE_CONTEXT", SignupState>
  | Evt<"done.invoke.register'", { data: unknown }>
  | Evt<"error.platform.register", { data: string }>;

const machine = createMachine<SignupState, SignupEvent, "signup">(
  {
    id: "signup",
    context: {
    },
    initial: 'noop',
    states: {
      noop: {
        on: {
          UPDATE_CONTEXT: {
            actions: "updateContext",
          },
          REGISTER: "submitting",
        },
      },
      submitting: {
        entry: 'clearError',
        invoke: {
          id: "register",
          src: "register",
          onDone: "registered",
          onError: {
            target: "noop",
            actions: "handleFailure",
          },
        },
      },
      registered: {
        entry: "clearCredentials",
      },
    },
  },
  {
    services: {
      register: (ctx) => async () => {
        const [status, data] = await authenticateTask(ctx)();
        debugger
        if (status >= 400) {
          throw data;
        }

        return data
      }, 
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