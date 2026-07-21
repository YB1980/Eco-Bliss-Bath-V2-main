Cypress.Commands.add('loginViaUI', (username, password) => {
  cy.visit('#/login');
  cy.get('[data-cy="login-input-username"]').type(username);
  cy.get('[data-cy="login-input-password"]').type(password);
  cy.get('[data-cy="login-submit"]').click();

  // Attendre la fin du traitement de l'authentification
  cy.get('[data-cy="nav-link-cart"]').should('be.visible');
});