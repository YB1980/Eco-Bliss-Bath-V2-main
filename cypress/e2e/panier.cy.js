describe('Fonctionnalité critique - Panier', () => {
  beforeEach(() => {
    // Connexion préalable
    cy.fixture('user.json').then((user) => {
      cy.loginViaUI(user.validUser.username, user.validUser.password);
    });

    // Chargement de la fixture produit sous forme d'alias
    cy.fixture('product.json').as('productData');
  });

  it('Vérifie la fiche produit, la disponibilité et que le stock est supérieur à 1', function () {
    cy.intercept('GET', '**/product*/**').as('getProduct');
    cy.visit(`/#/products/${this.productData.id}`);
    cy.wait('@getProduct').its('response.statusCode').should('eq', 200);

    // Vérification du nom et de la présence du champ de disponibilité (stock)
    cy.get('[data-cy="detail-product-name"]')
      .should('be.visible')
      .and('contain', this.productData.name);
    
    cy.get('[data-cy="detail-product-stock"]').should('be.visible');

    // Assertion : Le stock doit être supérieur à 1
    cy.get('[data-cy="detail-product-stock"]').invoke('text').then((text) => {
      const stockNumber = parseInt(text.replace(/\D/g, ''), 10);
      expect(stockNumber).to.be.greaterThan(1);
    });
  });

  it('Refuse une quantité négative', function () {
    cy.visit(`/#/products/${this.productData.id}`);

    cy.get('[data-cy="detail-product-quantity"]').clear().type('-1');
    cy.get('[data-cy="detail-product-quantity"]').should('have.class', 'ng-invalid');
  });

  it('Refuse une quantité supérieure à la limite (> 20)', function () {
    cy.visit(`/#/products/${this.productData.id}`);

    cy.get('[data-cy="detail-product-quantity"]').clear().type('25');
    cy.get('[data-cy="detail-product-quantity"]').should('have.class', 'ng-invalid');
  });

  it('Ajoute un produit au panier, contrôle via l API, le panier UI et la diminution du stock', function () {
    cy.intercept('GET', '**/product*/**').as('getProduct');
    cy.intercept('GET', '**/orders').as('getOrders');

    cy.visit(`/#/products/${this.productData.id}`);
    cy.wait('@getProduct');

    // 1. Capture du stock initial (attend que les chiffres soient chargés dans le DOM)
    cy.get('[data-cy="detail-product-stock"]')
      .should('be.visible')
      .should(($el) => {
        expect($el.text()).to.match(/\d+/); // Force Cypress à attendre la présence de chiffres
      })
      .invoke('text')
      .then((initialStockText) => {
        const initialStock = parseInt(initialStockText.replace(/\D/g, ''), 10);
        const quantityToAdd = 1;

        // 2. Saisie d'une quantité valide et ajout
        cy.get('[data-cy="detail-product-quantity"]').clear().type(String(quantityToAdd));
        cy.get('[data-cy="detail-product-add"]').click();

        // 3. Vérification UI dans la page panier
        cy.get('[data-cy="nav-link-cart"]').click();
        cy.get('[data-cy="cart-line-name"]').should('contain', this.productData.name);

        // 4. Vérification API : Contrôle du contenu du panier retourné par le backend
        cy.wait('@getOrders').then((interception) => {
          expect(interception.response.statusCode).to.eq(200);
          expect(interception.response.body).to.not.be.empty;
        });

        // 5. Retour sur la fiche produit et vérification de la diminution du stock
        cy.visit(`/#/products/${this.productData.id}`);
        cy.wait('@getProduct');

        // Attend que le nouveau stock soit affiché sous forme de chiffre avant parsing
        cy.get('[data-cy="detail-product-stock"]')
          .should('be.visible')
          .should(($el) => {
            expect($el.text()).to.match(/\d+/); // Empêche d'obtenir NaN
          })
          .invoke('text')
          .then((newStockText) => {
            const newStock = parseInt(newStockText.replace(/\D/g, ''), 10);
            expect(newStock).to.eq(initialStock - quantityToAdd);
          });
      });
  });
});