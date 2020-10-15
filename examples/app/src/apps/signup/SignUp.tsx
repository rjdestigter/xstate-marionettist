import React from "react";

import { useMachine } from "@xstate/compiled/react";

import machine from "./machine";
import RegistrationFrom from "./components/RegistrationForm";
import { Snackbar, SnackbarAction } from "@rmwc/snackbar";

const Auth = () => {
  const [state, send] = useMachine(machine, {
    devTools: process.env.NODE_ENV === "development",
  });

  if (state.matches("registered")) {
    return <div data-testid={"welcome"}>Hello World!</div>;
  }

  const error = (
    <Snackbar
      open={!!state.context.error}
      onClose={() => send({ type: "UPDATE_CONTEXT", error: undefined })}
      message={state.context.error}
      dismissesOnAction
      action={
        <SnackbarAction
          label="Dismiss"
          onClick={() => console.log("Click Me")}
        />
      }
    />
  );

  return (
    <>
      <RegistrationFrom
        email={state.context.email || ""}
        password={state.context.password || ""}
        repeatPassword={state.context.repeatPassword || ""}
        name={state.context.name || ""}
        age={state.context.age}
        submitting={state.matches("submitting")}
        error={state.context.error}
        onChange={(creds) => send({ type: "UPDATE_CONTEXT", ...creds })}
        onRegister={() => send("REGISTER")}
      />
      {error}
    </>
  );
};

export default Auth;
