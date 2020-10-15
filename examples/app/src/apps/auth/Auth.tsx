import React from "react";

import { useMachine } from '@xstate/compiled/react'

import machine from './machine'
import Login from "./components/Login";

const Auth = () => {
  const [state, send] = useMachine(machine, {
      devTools: process.env.NODE_ENV === 'development'
  })

  if (state.matches('authenticated')) {
    return (
      <div data-testid={'welcome'}>Hello World!</div>
    )
  }

  return (
    <Login
      email={state.context.email || ''}
      password={state.context.password || ''}
      authenticating={state.matches('authenticating')}
      error={state.context.error}
      onChange={creds => send({ type: 'UPDATE_CONTEXT', ...creds})}
      onLogin={() => send('LOGIN')}
    />
  );
};

export default Auth