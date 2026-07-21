describe('Tests API - Swagger Endpoints', () => {
  const apiUrl = Cypress.env('apiUrl');

  beforeEach(function () {
    // Chargement des fixtures sous forme d'alias
    cy.fixture('user.json').as('userData');
    cy.fixture('product.json').as('productData');
  });

  it('1. GET /orders - Doit retourner une erreur d authentification (401 ou 403)', function () {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      failOnStatusCode: false
    }).then((response) => {
      expect([401, 403]).to.include(response.status);
    });
  });

  it('2. POST /login - Authentification utilisateur (succès et échec)', function () {
    // Test utilisateur inconnu -> 401
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: this.userData.invalidUser,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
    });

    // Test utilisateur connu -> 200
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: this.userData.validUser
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('token');
    });
  });

  // Bloc regroupant les endpoints nécessitant une authentification préalable
  context('Endpoints sécurisés', () => {
    let token;

    beforeEach(function () {
      // Authentification automatique avant chaque test sécurisé
      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: this.userData.validUser
      }).then((response) => {
        token = response.body.token;
      });
    });

    it('3. GET /orders - Doit retourner le panier de l utilisateur connecté', function () {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/orders`,
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('4. GET /products/{id} - Doit retourner la fiche du produit', function () {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/products/${this.productData.id}`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(200);
      });
    });

// NOTE QA : La spécification indique un POST mais l'API backend / Swagger expose un PUT.
// Le test utilise PUT pour refléter le backend actuel, l'anomalie est consignée dans le README.
    it('5a. PUT /orders/add - Ajouter un produit disponible au panier', function () {
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/orders/add`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          product: this.productData.id,
          quantity: 1
        },
        failOnStatusCode: false
      }).then((response) => {
        expect([200, 201]).to.include(response.status);
      });
    });

    it('5b. PUT /orders/add - Refuser l ajout d un produit en rupture de stock', function () {
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/orders/add`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          product: this.productData.outOfStockId, // <-- Appel dynamique depuis la fixture
          quantity: 1
        },
        failOnStatusCode: false
      }).then((response) => {
        // Renvoie généralement une erreur 400 Bad Request ou 422 Unprocessable Entity
        expect([400, 422, 500]).to.include(response.status);
      });
    });

    it('6. POST /reviews - Doit ajouter un avis', function () {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/reviews`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          title: 'Super produit',
          comment: 'Très satisfait de cet achat.',
          rating: 5
        },
        failOnStatusCode: false
      }).then((response) => {
        expect([200, 201]).to.include(response.status);
      });
    });
  });
});