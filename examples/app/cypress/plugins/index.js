/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  console.log(config); // see what all is in here!

  // config.env.CI = "staging";
  // modify env value
  config.env.CI = process.env.CI
  config.env.NODE_ENV = process.env.NODE_ENV || config.env.NODE_ENV;
  // return config
  return config;
}
