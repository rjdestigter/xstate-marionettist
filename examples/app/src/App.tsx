import "@rmwc/button/styles";
import "@rmwc/textfield/styles";
import "@rmwc/theme/styles";
import "@rmwc/formfield/styles";
import "@rmwc/snackbar/styles";
import classes from './App.module.scss';

import React from 'react';

import Main from "./apps/main";

function App() {
  return (
    <div className={classes.App}>
      <Main />
    </div>
  );
}

export default App;
