import test from "../../test";

test({
  id: "conduit",
  visit: {
    path: "/",
  },
  // plan: [7, 8],
  apis: [
    {
      path: ".*/api/users/login$",
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
      path: ".*/api/user/$",
      deferrals: ["user"],
      outcomes: {
        "*": {
          body: {
            user: {
              id: 119095,
              email: "jane@doe.com",
              createdAt: "2020-10-15T17:28:23.804Z",
              updatedAt: "2020-10-15T17:28:23.912Z",
              username: "jane.doe",
              bio: null,
              image: null,
              token: "abc123",
            },
          },
        },
      },
    },
    {
      path: ".*/api/users$",
      deferrals: ["register"],
      outcomes: {
        BAD_SIGNUP: {
          status: 422,
          body: {
            errors: {
              email: ["is invalid"],
              password: ["is too short"],
            },
          },
        },
        OK_SIGNUP: {
          body: {
            user: {
              id: 119095,
              email: "jane@doe.com",
              createdAt: "2020-10-15T17:28:23.804Z",
              updatedAt: "2020-10-15T17:28:23.912Z",
              username: "jane.doe",
              bio: null,
              image: null,
              token: "abc123",
            },
          },
        },
        '*': {
          body: {
            user: {
              id: 119095,
              email: "jane2@doe.com",
              createdAt: "2020-10-15T17:28:23.804Z",
              updatedAt: "2020-10-15T17:28:23.912Z",
              username: "jane2.doe",
              bio: null,
              image: null,
              token: "abc123",
            },
          },
        },
      },
    },
    {
      path: ".*/api/tags/$",
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
      path: ".*/api/articles?.*",
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
  viewport: {
    width: 1920,
    height: 1080,
  },
  beforeVisit: [
    (cy) => cy.log("Start"),
    (cy) =>
      cy.window().then((win) => {
        win.navigator.serviceWorker.register = () => new Promise(() => void 0);
      }),
    ["defer", "tags"],
    ["defer", "articles"],
  ],
  initial: "anonymous",
  states: {
    // Initial home page, articles and tags haven't downloaded yet
    anonymous: {
      tests: [
        ["waitForSelector", "#app"],
        ["waitForSelector", ".home-page"],
        ["waitForSelector", ".container.page"],
        [
          "expectProperty",
          ".article-preview",
          "textContent",
          "Loading articles...",
        ],
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
            ["click", '[href="#/login"]'],
          ],
        },
        SIGNUP: {
          target: "signUp",
          actions: [
            ["resolve", "tags"],
            ["resolve", "articles"],
            ["click", '[href="#/register"]'],
          ],
        },
      },
    },

    // State for post-signup or post-login
    authenticated: {
      tests: [
        ["waitForSelector", "#app"],
        ["waitForSelector", ".home-page"],
        ["waitForSelector", ".container.page"],
        [
          "expectProperty",
          ".article-preview",
          "textContent",
          "Loading articles...",
        ],
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
        cy => cy.log('State: withTags'),
        ["waitForSelector", ".tag-default.tag-pill"],
        [
          "expectProperty",
          ".article-preview",
          "textContent",
          "Loading articles...",
        ],
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
        (cy) =>
          cy.get(".article-preview:nth-child(1) h1"),
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
        cy => cy.log('signup'),
        ["expectProperty", ".auth-page h1", "textContent", "Sign up"],
        ["waitForSelector", 'input[placeholder="Username"]'],
        ["waitForSelector", 'input[placeholder="Email"]'],
        ["waitForSelector", 'input[type="password"]'],
        ["waitForSelector", "button"],
      ],
      on: {
        REGISTER: {
          target: "signingUp",
          actions: [
            ["type", 'input[placeholder="Username"]', "Jane Doe"],
            ["type", 'input[placeholder="Email"]', "jane@doe.com"],
            ["type", 'input[type="password"]', "abc123"],
            [
              "expectProperty",
              'input[placeholder="Username"]',
              "value",
              "Jane Doe",
            ],
            [
              "expectProperty",
              'input[placeholder="Email"]',
              "value",
              "jane@doe.com",
            ],
            ["expectProperty", 'input[type="password"]', "value", "abc123"],
            ["defer", "register"],
            ["click", "button"],
          ],
        },
      },
    },
    signingUp: {
      tests: [
        ["waitForSelector", 'input[placeholder="Username"]'],
        ["waitForSelector", 'input[placeholder="Email"]'],
        ["waitForSelector", 'input[type="password"]'],
        ["waitForSelector", "button"],
      ],
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
          "email is invalid",
        ],
        [
          "expectProperty",
          "ul.error-messages>li:nth-child(2)",
          "textContent",
          "password is too short",
        ],
      ],
    },

    // State for testing the sign-in workflow
    signIn: {
      on: {
        LOGIN: {
          target: "authenticating",
          actions: [
            ["type", 'input[placeholder="Email"]', "jane@doe.com"],
            ["type", 'input[type="password"]', "abc123"],
            ["defer", "login"],
            ["click", 'button[class="btn btn-lg btn-primary pull-xs-right"]'],
          ],
        },
      },
      tests: [
        ["waitForSelector", 'input[placeholder="Email"]'],
        ["waitForSelector", 'input[type="password"]'],
        [
          "waitForSelector",
          'button[class="btn btn-lg btn-primary pull-xs-right"]',
        ],
      ],
    },
    authenticating: {
      tests: [
        // Articles and tags are refreshed post-login so lets
        ["defer", "articles"],
        ["defer", "tags"],
        ["resolve", "login"],
        ["waitForSelector", '[href="#/@jane.doe/"]'],
      ],
      on: {
        AUTHENTICATED: {
          target: "authenticated",
        },
      },
    },
  },
})
