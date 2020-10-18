module.exports = {
  preset: "jest-playwright-preset",
  bail: 1,
  testRegex: "./*\\.playwright\\.ts?$",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
  },
  extraGlobals: [],
  // setupFilesAfterEnv: ["./jest-e2e-setup.js"],
};
