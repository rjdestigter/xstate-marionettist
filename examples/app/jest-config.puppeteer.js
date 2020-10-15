module.exports = {
  preset: "jest-puppeteer",
  bail: 1,
  testRegex: "./*\\.puppeteer\\.ts?$",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["./jest-env.puppeteer.js", "expect-puppeteer"],
};
