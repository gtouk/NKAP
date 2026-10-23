# Plateforme de transfert

Le service couvre le Canada vers le Cameroun, avec des corridors préparés pour la Côte d'Ivoire, le Sénégal, le Gabon et le Congo. Un corridor Cameroun vers Canada existe et reste désactivé.

## Parcours client

Compte, connexion par courriel ou téléphone, récupération du mot de passe, double authentification par code, profil, bénéficiaires, devis (frais, taux, montant reçu, délai), confirmation, référence `BEX-CM-2026-000001`, reçu PDF et chronologie.

Le paiement Interac ou virement est branché sur un adaptateur. Tant qu'aucun partenaire réel n'est configuré, l'écran de suivi propose une simulation du paiement reçu. Elle est désactivée si `NODE_ENV=production`.

## KYC et conformité

Les documents sont stockés hors du site public. Le statut est en attente, approuvé, refusé ou information supplémentaire. Le fournisseur actif est `manual` ; `KYC_PROVIDER` désigne un futur fournisseur externe.

Une liste interne bloque les sanctions et met en attente les PEP et les montants inhabituels. Les limites min, max, quotidiennes et mensuelles viennent du corridor.

## Rôles

`support` consulte. `compliance` revoit KYC et transactions. `finance` rapproche, règle les remboursements et les taux. `admin` gère le bureau. `superAdmin` gère les partenaires et les rôles internes. Les secrets de partenaire ne sont pas renvoyés : seul un nom de variable d'environnement est stocké.

## Notifications

Chaque événement écrit un courriel, un SMS et un WhatsApp. Le courriel part si `EMAIL_USER` et `EMAIL_PASS` sont définis. SMS et WhatsApp restent en file (`TWILIO_SID`, `WHATSAPP_TOKEN`) jusqu'à branchement du fournisseur.

## Sauvegarde

`scripts/backup.sh` produit un dump SQL à partir des variables `DB_HOST`, `DB_USER`, `DB_PASSWORD` et `DB_NAME`.

## Intégration continue

À chaque poussée et à chaque pull request, GitHub Actions lance les tests de l'API contre MySQL et construit le site. Sur `main`, le site compilé est archivé et l'image de l'API est publiée sur `ghcr.io/<compte>/nkap-api`.

Le build du site utilise la variable de dépôt `REACT_APP_API_URL` quand elle existe. Sinon, le site appelle `http://localhost:5000`.

## Applications mobiles

Le site est responsive. Les applications Android et iOS sont à chiffrer à part ; elles ne font pas partie de cette livraison.
