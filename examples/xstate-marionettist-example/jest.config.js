module.exports = {
  preset: "jest-puppeteer",
  bail: 1,
  testRegex: "./*\\.e2e\\.ts?$",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  // setupFiles: ["./env/env.js"],
  setupFilesAfterEnv: ["./jest-e2e-setup.js", "expect-puppeteer"],
};
