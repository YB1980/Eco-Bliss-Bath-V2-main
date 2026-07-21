describe('Smoke Tests', () => {
  beforeEach(() => {
    cy.fixture('user.json').as('userData');
    cy.fixture('product.json').as('productData');
  });

  it('Vérifie la présence des champs et boutons sur la page de connexion', () => {
    cy.visit('#/login');
    cy.get('[data-cy="login-input-username"]').should('be.visible');
    cy.get('[data-cy="login-input-password"]').should('be.visible');
    cy.get('[data-cy="login-submit"]').should('be.visible');
  });

  it('Vérifie la présence des boutons d ajout au panier une fois connecté', function () {
    // Connexion préalable
    cy.loginViaUI(this.userData.validUser.username, this.userData.validUser.password);

    // Vérification sur la fiche produit
    cy.visit(`/#/products/${this.productData.id}`);
    cy.get('[data-cy="detail-product-add"]').should('be.visible');
  });
});