describe('Sécurité - Analyse des failles XSS dans les avis', () => {
  beforeEach(function () {
    cy.fixture('user.json').as('userData');
  });

  it('Vérifie l absence de faille XSS lors de la publication d un avis', function () {
    // 1. Connexion via votre commande existante
    cy.loginViaUI(this.userData.validUser.username, this.userData.validUser.password);

    // 2. Navigation vers la section des avis
    cy.get('[data-cy="nav-link-reviews"]').click();

    // 3. Préparation du piège XSS : écouter si une alerte système est déclenchée
    let hasXssTriggered = false;
    cy.on('window:alert', () => {
      hasXssTriggered = true;
      throw new Error('Faille XSS détectée : une fenêtre d alert() s est exécutée !');
    });

    // 4. Remplissage du formulaire d'avis
    cy.get('[data-cy="review-input-rating-images"] img').first().click();
    cy.get('[data-cy="review-input-title"]').type('Test Sécurité');
    cy.get('[data-cy="review-input-comment"]').type('<script>alert("XSS")</script>');

    // 5. Soumission du formulaire
    cy.get('[data-cy="review-submit"]').click();

    // 6. Assertion finale : vérifier que le script n'a pas été exécuté
    cy.then(() => {
      expect(hasXssTriggered).to.be.false;
    });
  });
});