module.exports =
  !process.env.CI && process.env.NODE_ENV !== "production"
    ? {
        launch: {
          headless: false,
          slowMo: 0,
          args: ["--start-maximized"],
        },
      }
    : {
        server: {
          command: `npm run build && npm run serve:e2e`,
          port: 7777,
          launchTimeout: 300000,
          usedPortAction: "ignore",
        },
        launch: {
          headless: !!process.env.CI,
          slowMo: 0,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      };
