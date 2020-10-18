import debug from "debug";
import { Configuration } from "xstate-marionettist";
import { create } from "xstate-marionettist-playwright";
import { Page, ChromiumBrowserContext } from "playwright";

const test = create({
  selectorWrapper: (_) => _,
  ports: {
    prod: 80,
    ci: 80,
    dev: 80,
  },
  server: "http://realworld.svelte.dev",
});

declare const context: ChromiumBrowserContext;

const find = (data: any) => {
  debug("e2e")("page");

  if (data) {
    if (data.send) {
      debug("e2e")("send");

      return [];
    }

    return Object.keys(data)
      .map((key) => {
        debug("e2e")(key);

        if (data[key]) {
          const result = find(data[key]);

          if (result.length > 0) {
            return [key, ...result];
          }
        }

        return [];
      })
      .filter((_) => _.length > 0);
  }

  return [];
};

const config: Configuration<Page> = {
  id: "conduit",
  visit: {
    path: "/",
  },
  apis: [
    {
      path: "/auth/login",
      deferrals: ["login"],
      outcomes: {
        "*": {
          body: {
            user: {
              id: 118516,
              email: "jane@doe.com",
              createdAt: "2020-10-10T14:44:46.775Z",
              updatedAt: "2020-10-10T14:44:46.780Z",
              username: "jane.doe",
              bio: null,
              image: null,
              token: "abc_token",
            },
          },
        },
      },
    },
    {
      path: "/auth/register",
      deferrals: ["register"],
      outcomes: {
        BAD_SIGNUP: {
          body: {
            errors: {
              email: ["has already been taken"],
              username: ["has already been taken"],
            },
          },
        },
        OK_SIGNUP: {
          body: {
            user: {
              id: 118518,
              email: "jane@doe.com",
              createdAt: "2020-10-10T15:35:38.195Z",
              updatedAt: "2020-10-10T15:35:38.204Z",
              username: "jane.doe",
              bio: null,
              image: null,
              token: "abc_token",
            },
          },
        },
      },
    },
    {
      path: "/api/tags",
      deferrals: ["tags"],
      outcomes: {
        "*": {
          body: {
            tags: ["Red", "Green", "Blue"],
          },
        },
      },
    },
    {
      path: "/api/articles",
      deferrals: ["articles"],
      outcomes: {
        "*": {
          body: {
            articles: [
              {
                title: "Foo Bar",
                slug: "nbhb-v2oqxw",
                body: "hbhb",
                createdAt: "2020-10-10T03:18:59.464Z",
                updatedAt: "2020-10-10T03:18:59.464Z",
                tagList: [],
                description: "hhb",
                author: {
                  username: "lsalfin",
                  bio: null,
                  image:
                    "https://static.productionready.io/images/smiley-cyrus.jpg",
                  following: false,
                },
                favorited: false,
                favoritesCount: 1,
              },
              {
                title: "Cypress Test",
                slug: "cypress-test-f8f9sp",
                body:
                  "I am very excited to write my first Test in Cypress, Thanks",
                createdAt: "2020-10-10T03:18:31.112Z",
                updatedAt: "2020-10-10T03:18:31.112Z",
                tagList: [],
                description: "My First Test in cypress",
                author: {
                  username: "lsalfin",
                  bio: null,
                  image:
                    "https://static.productionready.io/images/smiley-cyrus.jpg",
                  following: false,
                },
                favorited: false,
                favoritesCount: 0,
              },
            ],
            articlesCount: 2,
          },
        },
      },
    },
  ],
  outcomes: ["BAD_SIGNUP", "OK_SIGNUP"],
  viewport: {
    width: 1920,
    height: 1080,
  },
  beforeVisit: [
    ["defer", "tags"],
    ["defer", "articles"],
  ],
  initial: "anonymous",
  states: {
    // Initial home page, articles and tags haven't downloaded yet
    anonymous: {
      tests: [
        ["waitForSelector", "#sapper"],
        ["waitForSelector", ".home-page"],
        ["waitForSelector", ".container.page"],
        ["expectProperty", ".article-preview", "textContent", "Loading..."],
      ],
      on: {
        DOWNLOADED_TAGS: {
          target: "withTags",
          actions: [["resolve", "tags"]],
        },
        DOWNLOADED_ARTICLES: {
          target: "withArticles",
          actions: [["resolve", "articles"]],
        },
        SIGNIN: {
          target: "signIn",
          actions: [
            ["resolve", "tags"],
            ["resolve", "articles"],
            ["click", '[href="/login"]'],
          ],
        },
        SIGNUP: {
          target: "signUp",
          actions: [
            ["resolve", "tags"],
            ["resolve", "articles"],
            ["click", '[href="/register"]'],
          ],
        },
      },
    },

    // State for post-signup or post-login
    authenticated: {
      tests: [
        ["waitForSelector", "#sapper"],
        ["waitForSelector", ".home-page"],
        ["waitForSelector", ".container.page"],
        ["expectProperty", ".article-preview", "textContent", "Loading..."],
      ],
      on: {
        DOWNLOADED_TAGS: {
          target: "withTags",
          actions: [["resolve", "tags"]],
        },
        DOWNLOADED_ARTICLES: {
          target: "withArticles",
          actions: [["resolve", "articles"]],
        },
      },
    },

    // State for testing after tags have downloaded
    withTags: {
      tests: [
        ["waitForSelector", ".tag-default.tag-pill"],
        ["expectProperty", ".article-preview", "textContent", "Loading..."],
      ],
      on: {
        DOWNLOADED_ARTICLES: {
          target: "withTagsAndArticles",
          actions: [["resolve", "articles"]],
        },
      },
    },

    // State for testing when articles have downloaded
    withArticles: {
      tests: [
        ["waitForSelector", ".article-preview"],
        ["waitForSelector", ".article-preview:nth-child(1) h1"],
        ["waitForSelector", ".article-preview:nth-child(2) h1"],
        [
          "expectProperty",
          ".article-preview:nth-child(1) h1",
          "textContent",
          "Foo Bar",
        ],
        [
          "expectProperty",
          ".article-preview:nth-child(2) h1",
          "textContent",
          "Cypress Test",
        ],
      ],
      on: {
        DOWNLOADED_TAGS: {
          target: "withTagsAndArticles",
          actions: [["resolve", "tags"]],
        },
      },
    },

    // State for testing when both articles and tags have downloded
    withTagsAndArticles: {
      tests: [
        ["waitForSelector", ".tag-default.tag-pill"],
        ["waitForSelector", ".article-preview"],
      ],
    },

    // State for testing the sign-up workflow
    signUp: {
      tests: [
        ["expectProperty", ".auth-page h1", "textContent", "Sign up"],
        ["waitForSelector", 'input[placeholder="Your Name"]'],
        ["waitForSelector", 'input[type="email"]'],
        ["waitForSelector", 'input[type="password"]'],
        ["waitForSelector", "button"],
      ],
      on: {
        REGISTER: {
          target: "signingUp",
          actions: [
            ["type", 'input[placeholder="Your Name"]', "Jane Doe"],
            ["type", 'input[type="email"]', "jane@doe.com"],
            ["type", 'input[type="password"]', "abc123"],
            [
              "expectProperty",
              'input[placeholder="Your Name"]',
              "value",
              "Jane Doe",
            ],
            ["expectProperty", 'input[type="email"]', "value", "jane@doe.com"],
            ["expectProperty", 'input[type="password"]', "value", "abc123"],
            ["defer", "register"],
            ["click", "button"],
          ],
        },
      },
    },
    signingUp: {
      tests: [],
      on: {
        BAD_SIGNUP: {
          actions: [["resolve", "register"]],
          target: "signUpFailed",
        },
        OK_SIGNUP: {
          actions: [
            ["defer", "articles"],
            ["defer", "tags"],
            ["resolve", "register"],
          ],
          target: "authenticated",
        },
      },
    },
    signUpFailed: {
      tests: [
        ["waitForSelector", "ul.error-messages"],
        ["waitForSelector", "ul.error-messages>li:nth-child(1)"],
        ["waitForSelector", "ul.error-messages>li:nth-child(2)"],
        [
          "expectProperty",
          "ul.error-messages>li:nth-child(1)",
          "textContent",
          "email has already been taken",
        ],
        [
          "expectProperty",
          "ul.error-messages>li:nth-child(2)",
          "textContent",
          "username has already been taken",
        ],
      ],
    },

    // State for testing the sign-in workflow
    signIn: {
      on: {
        LOGIN: {
          target: "authenticating",
          actions: [
            ["type", 'input[type="email"]', "jane@doe.com"],
            ["type", 'input[type="password"]', "abc123"],
            ["defer", "login"],
            ["click", 'button[type="submit"]'],
          ],
        },
      },
      tests: [
        ["waitForSelector", 'input[type="email"]'],
        ["waitForSelector", 'input[type="password"]'],
        ["waitForSelector", 'button[type="submit"]'],
      ],
    },
    authenticating: {
      tests: [
        // Articles and tags are refreshed post-login so lets
        ["defer", "articles"],
        ["defer", "tags"],
        ["resolve", "login"],
        ["waitForSelector", '[href="/profile/@jane.doe"]'],
      ],
      on: {
        AUTHENTICATED: {
          target: "authenticated",
        },
      },
    },
  },
};

test(config);
