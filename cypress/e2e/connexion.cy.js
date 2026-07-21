describe('Fonctionnalité critique - Connexion', () => {
  beforeEach(function () {
    // Chargement de la fixture avant chaque test
    cy.fixture('user.json').as('userData');
  });

  it('1. Navigation : Affiche la page et le formulaire de connexion', () => {
    // Étape 1 & 2 : Navigation vers l'accueil puis clic sur Connexion
    cy.visit('/');
    cy.get('[data-cy="nav-link-login"]').click();

    // Étape 3 : Vérification de l'affichage du formulaire
    cy.url().should('include', '/login');
    cy.get('[data-cy="login-input-username"]').should('be.visible');
    cy.get('[data-cy="login-input-password"]').should('be.visible');
    cy.get('[data-cy="login-submit"]').should('be.visible');
  });

  it('2. Soumission : Permet de se connecter avec des identifiants valides et affiche le panier', function () {
    cy.visit('#/login');

    // Étape 4 & 5 : Saisie des identifiants (test2@test.fr / testtest)
    cy.get('[data-cy="login-input-username"]').type(this.userData.validUser.username);
    cy.get('[data-cy="login-input-password"]').type(this.userData.validUser.password);

    // Soumission du formulaire
    cy.get('[data-cy="login-submit"]').click();

    // Résultat attendu : Présence du bouton panier
    cy.get('[data-cy="nav-link-cart"]').should('be.visible');
  });
});