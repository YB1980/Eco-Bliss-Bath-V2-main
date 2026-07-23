# Tests automatisés Cypress - Eco Bliss Bath

## ⚠️ Avertissement : Réinitialiser la base avant de lancer les tests du panier

Le produit utilisé par les tests du panier (`cypress/fixtures/products.json`) a son stock **réellement décrémenté en base** à chaque ajout. Aucun endpoint de l'API ne permet de le restaurer automatiquement (voir swagger). Si vous relancez la suite plusieurs fois sans réinitialiser la base, le stock finit par devenir insuffisant, voire négatif, et les tests échouent avec des erreurs qui n'ont rien à voir avec un vrai bug (`NaN`, timeouts...).

Avant chaque nouvelle session de tests, repartez d'une base propre :

```bash
docker compose down -v
docker compose up -d
```

Le test `Panier` échoue volontairement et tôt, avec un message explicite, si le stock du produit de test est insuffisant — c'est le signal qu'il faut réinitialiser la base.

---

## Pré-requis et Installation

Depuis le dossier `frontend` :
```bash
npm install
```

1. Démarrer l'API et sa base de données (depuis la racine du projet) :
```bash
docker compose up -d
```
2. Démarrer le frontend :
```bash
npm start
```
   (le site doit être accessible sur http://localhost:4200)

---

## Lancer les tests

- Mode interactif (recommandé en développement) :
```bash
npx cypress open
```
- Mode headless (CI) :
```bash
npx cypress run
```

---

## Organisation de la suite de tests

Les tests sont découpés pour couvrir de manière exhaustive les couches fonctionnelles, API et sécurité de l'application :

*   **`smoke.cy.js` :** Validation rapide des composants essentiels (présence des champs de connexion et du bouton d'ajout au panier après authentification).
*   **`api.cy.js` :** Validation des contrats d'interface (endpoints Swagger) pour l'authentification, les commandes, les produits et les avis.
*   **`connexion.cy.js` :** Parcours E2E critique validant l'interface de connexion utilisateur.
*   **`panier.cy.js` :** Parcours E2E critique validant l'ajout au panier, la vérification des limites de quantité et la décrémentation du stock en direct.
*   **`xss.cy.js` :** Contrôle de sécurité s'assurant que les espaces de saisie (comme les commentaires/avis) neutralisent correctement les injections de scripts malveillants.

Les données de test (utilisateur, produit, avis) sont centralisées dans `cypress/fixtures` pour éviter de dupliquer les mêmes objets dans plusieurs fichiers de test. Les commandes custom se trouvent dans `cypress/support/commands.js`.

---

## Choix techniques

- **Sélecteurs résilients (`data-cy`)** : tous les tests s'appuient sur les attributs `data-cy` déjà présents dans le HTML, plutôt que sur des classes CSS ou du texte, pour ne pas casser les tests si le design change.
- **Maîtrise de l'asynchronisme (`cy.intercept`)** : utilisés à la place de temporisations fixes (`cy.wait(1000)`) pour attendre la fin réelle des appels réseau.
- **Optimisation de session (`cy.session()`)** : la connexion est mise en cache entre les tests qui n'ont besoin que d'être connectés (panier, smoke tests), afin d'accélérer l'exécution. Un test dédié (`connexion.cy.js`) vérifie tout de même le parcours de connexion complet via l'interface.
- **Détection proactive d'alertes (XSS)** : Utilisation d'écouteurs d'événements natifs (`cy.on('window:alert')`) pour intercepter et faire échouer les tests de sécurité si une faille d'injection est exploitée.

---

## Bilan des Anomalies et Écarts

**Anomalies connues (voir bilan de Marie)**
- `GET /orders` sans authentification retourne 401 au lieu du 403 attendu.
- `POST /orders/add` est en réalité exposé en `PUT` côté frontend.

**Anomalies détectées par la suite Cypress**
- Front-end : Absence de validation de quantité. Le champ input de quantité sur la fiche produit manque d'attributs de validation (min="1", max="20"). Saisir une valeur excessive (25) ne déclenche aucune erreur côté UI (la classe Angular ng-invalid ne s'applique pas). Les tests liés aux limites de quantités dans `panier.cy.js` échouent pour matérialiser ce bug.
- Back-end : Ajout de produits en rupture.`PUT /orders/add` retourne `200 OK` et ajoute au panier un produit dont le `availableStock` est à 0 (aucune vérification du stock côté API). Le test lié au produit en rupture de stock (`api.cy.js`) est laissé volontairement en échec pour matérialiser cette anomalie tant qu'elle n'est pas corrigée — c'est une régression détectée par les tests, pas un bug de script.
- Back-end : Absence de limite de quantité. Aucune limite de quantité (ex. max 20) ne semble appliquée côté API sur `PUT /orders/add` (voir les tests de limites dans `panier.cy.js`).

Ces points sont documentés dans les tests concernés et devront être corrigés côté backend/frontend puis les assertions mises à jour en conséquence.

## ⚠️ Point de vigilance qualité

La découverte d'un affichage de stocks négatifs sur l'interface front-end met en évidence un défaut d'ergonomie qui nécessite une correction rapide pour préserver l'image de marque de la plateforme _Eco Bliss Bath_.