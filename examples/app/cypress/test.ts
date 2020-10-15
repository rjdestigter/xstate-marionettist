import  { create } from "../../../packages/cypress";

const port = Cypress.env('CI') ? 7777 : 3000

export default create({
    ports: {
        ci: port,
        dev: port,
        prod: port
    }
})

