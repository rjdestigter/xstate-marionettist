module.exports = {
  launch: {
    headless: !!process.env.CI,
    slowMo: 20,
    devtools: true,
    args: [
      "--start-maximized",
      "--disable-shared-workers",
      "--aggressive-cache-discard",
      "--incognito",
      "--disk-cache-dir=null",
    ],
  },
};
