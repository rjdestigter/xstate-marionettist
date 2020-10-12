module.exports = {
  launchOptions: {
    headless: false,
    slowMo: 0,
    args: ["--start-maximized"],
  },
  serverOptions: {
    command: `npm run serve:playwright`,
    port: 9999,
    launchTimeout: 60000,
    usedPortAction: "ignore",
  },
};
