import "@rmwc/button/styles";
import "@rmwc/textfield/styles";
import "@rmwc/theme/styles";
import "@rmwc/formfield/styles";
import classes from './App.module.scss';

import React from 'react';

import Auth from './apps/auth'

function App() {
  return (
    <div className={classes.App}>
      <Auth />      
    </div>
  );
}

export default App;
