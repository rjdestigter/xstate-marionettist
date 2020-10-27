import  { create } from "../../../packages/cypress";

export default create({
  ports: {
    ci: 0,
    dev: 0,
    prod: 0,
  },
  selectorWrapper: (_) => _,
  server: "https://vue-vuex-realworld.netlify.app",
});

