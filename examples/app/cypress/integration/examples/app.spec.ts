/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

describe("Foobar", () => {
  it("Baz", () => {
    cy.visit("http://localhost:7777");

    cy.findByTestId('btn-auth').click()
cy.findByTestId("txt-email");
    const promise = new Cypress.Promise(resolve => {
      cy.log('Loggin')
      setTimeout(() => {
        debugger
        cy.findByTestId('txt-email').type('me@you.com').then(() => resolve())
      }, 1000)
    }).then(() => {
      cy.log('Next')
      cy.findByTestId('txt-password')
    }).then(() => {
      cy.log('ok')
    })

    cy.then(_ => promise)
  });
});
