module.exports = {
  launchOptions: {
    headless: !!process.env.CI,
    slowMo: 0,
    devtools: true,
    args: [
      "--start-maximized",
      "--window-size=1920,1080",
      "--disable-shared-workers",
      "--aggressive-cache-discard",
      "--incognito",
      "--disk-cache-dir=null",
    ],
  },
};
