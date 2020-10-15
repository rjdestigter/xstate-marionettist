import classes from "./main.module.scss";

import React from "react";
import { Button } from "@rmwc/button";

import Auth from "../auth";
import Signup from "../signup";

const Main = () => {
  const [app, setApp] = React.useState<"main" | "auth" | "signup">("main");

  const content = app === "auth" ? <Auth /> : app === 'signup' ? <Signup /> : null

  return (
    <section className={classes.main}>
      <nav>
        <Button
          data-testid="btn-main"
          onClick={() => setApp("main")}
          unelevated={app === "main"}
          outlined={app !== "main"}
          icon={'home'}
        >
          Home
        </Button>
        <Button
          data-testid="btn-auth"
          onClick={() => setApp("auth")}
          unelevated={app === "auth"}
          outlined={app !== "auth"}
        >
          Sign In
        </Button>
        <Button
          data-testid="btn-signup"
          onClick={() => setApp("signup")}
          unelevated={app === "signup"}
          outlined={app !== "signup"}
        >
          Sign Up
        </Button>
      </nav>
      <br />
      <div data-testid="content">{content}</div>
    </section>
  );
};

export default Main;
