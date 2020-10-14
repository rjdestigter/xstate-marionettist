import React from "react";

import { TextField } from "@rmwc/textfield";
import { Button } from "@rmwc/button";

type Credentials = {
  email: string;
  password: string;
};

type propsLogin = Credentials & {
  authenticating: boolean;
  error?: string;
  onChange: (creds: Partial<Credentials>) => void;
  onLogin: () => void;
};

const Login = (props: propsLogin) => {

  React.useLayoutEffect(() => {
    document.querySelector<HTMLInputElement>('input[name="email"]')?.focus()
  }, [])
  
  return (
    <form
      data-testid="frm-login"
      onSubmit={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      <TextField
        data-testid="txt-email"
        autoComplete="off"
        outlined
        name="email"
        label="E-mail"
        type="email"
        icon="mail"
        value={props.email}
        disabled={props.authenticating}
        onChange={(evt) => props.onChange({ email: evt.currentTarget.value })}
        helpText={{
          validationMsg: !!props.error,
          theme: !!props.error ? "error" : [],
          children: props.error || "What is your email address?",
          persistent: !!props.error,
          "data-testid": `txt-email-helptext${!!props.error ? ' txt-email-helptext-error' : ''}`,
        }}
      />
      <br />
      <TextField
        data-testid="txt-password"
        autoComplete="off"
        outlined
        name="password"
        label="Password"
        type="password"
        icon="lock"
        value={props.password}
        disabled={props.authenticating}
        onChange={(evt) =>
          props.onChange({ password: evt.currentTarget.value })
        }
      />
      <br />
      <br />
      <Button
        data-testid="btn-login"
        raised
        onClick={props.onLogin}
        disabled={!!props.authenticating}
      >
        Sign-in
      </Button>
    </form>
  );
};

export default Login;
