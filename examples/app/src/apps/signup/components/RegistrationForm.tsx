import React from "react";

import { TextField } from "@rmwc/textfield";
import { Button } from "@rmwc/button";

type Registration = {
  name: string;
  email: string;
  age?: number;
  password: string;
  repeatPassword: string;
};

type propsRegistrationForm = Registration & {
  submitting: boolean;
  error?: string;
  onChange: (creds: Partial<Registration>) => void;
  onRegister: () => void;
};

const toAge = (value: string) => {
  const age = +value

  if (age >= 0 && age <= 200) {
    return age
  }
}

const RegistrationForm = (props: propsRegistrationForm) => {

  React.useLayoutEffect(() => {
    document.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  }, [])
  
  const txtName = (
    <TextField
      data-testid="txt-name"
      autoComplete="off"
      outlined
      name="name"
      label="Name"
      icon="person"
      value={props.name}
      disabled={props.submitting}
      onChange={(evt) => props.onChange({ name: evt.currentTarget.value })}
    />
  );
  
  const txtEmail = (
    <TextField
      data-testid="txt-email"
      autoComplete="off"
      outlined
      name="email"
      type="email"
      label="Email"
      icon="mail"
      value={props.email}
      disabled={props.submitting}
      onChange={(evt) => props.onChange({ email: evt.currentTarget.value })}
    />
  );
  
  const txtAge = (
    <TextField
      data-testid="txt-age"
      autoComplete="off"
      outlined
      name="age"
      type="age"
      label="Age"
      icon="event"
      value={props.age}
      disabled={props.submitting}
      onChange={(evt) => props.onChange({ age: toAge(evt.currentTarget.value) })}
    />
  );

  const txtPassword = (
    <TextField
      data-testid="txt-password"
      autoComplete="new-password"
      outlined
      name="password"
      label="Password"
      type="password"
      icon="lock"
      value={props.password}
      disabled={props.submitting}
      onChange={(evt) => props.onChange({ password: evt.currentTarget.value })}
    />
  );

  const txtRepeatPassword = (
    <TextField
      data-testid="txt-repeat-password"
      autoComplete="new-password"
      outlined
      name="repeat-password"
      label="Repeat password"
      type="password"
      icon="lock"
      value={props.repeatPassword}
      disabled={props.submitting}
      onChange={(evt) => props.onChange({ repeatPassword: evt.currentTarget.value })}
    />
  );

  return (
    <form
      data-testid="frm-registration"
      onSubmit={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {txtName}
      <br /><br />
      {txtEmail}
      <br /><br />
      {txtAge}
      <br /><br />
      {txtPassword}
      <br /><br />
      {txtRepeatPassword}
      <br /><br />
      <br />
      <br />
      <Button
        data-testid="btn-register"
        raised
        onClick={props.onRegister}
        disabled={props.submitting}
      >
        Sign-up
      </Button>
    </form>
  );
};

export default RegistrationForm;
