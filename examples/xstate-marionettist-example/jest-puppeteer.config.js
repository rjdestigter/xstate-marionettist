module.exports = {
  server: {
    command: `npm run build && npm run serve:e2e`,
    port: 7777,
    launchTimeout: 300000,
    usedPortAction: "ignore",
  },
  launch: {
    headless: !!process.env.CI,
    slowMo: 10,
    args: /true/i.test(process.env.LOCAL_CI)
      ? []
      : ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
  },
};
