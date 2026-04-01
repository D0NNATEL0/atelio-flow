# Base de donnees Atelio

## Objectif

Ce schema est pense pour un MVP Supabase/PostgreSQL qui couvre :

- authentification
- organisation / societe
- clients
- devis et lignes de devis
- factures et lignes de facture
- paiements
- relances
- abonnement premium

## Tables principales

### organizations

Contient les informations de la societe qui utilise Atelio.

### profiles

Etend `auth.users` avec les informations applicatives de l'utilisateur.

### clients

Stocke les fiches client de chaque organisation.

### quotes

Stocke les devis avec leur statut :

- `draft`
- `sent`
- `pending`
- `accepted`
- `rejected`
- `expired`

### quote_items

Lignes d'un devis avec quantite, prix unitaire, TVA et total.

### invoices

Stocke les factures avec leur statut :

- `draft`
- `sent`
- `paid`
- `partial`
- `overdue`
- `cancelled`

### invoice_items

Lignes d'une facture.

### invoice_payments

Paiements lies a une facture pour suivre le reglement partiel ou complet.

### reminders

Relances manuelles ou automatiques pour devis et factures.

### subscriptions

Etat de l'offre gratuite ou premium, avec les identifiants Stripe.

## Relations principales

- un `profile` appartient a une `organization`
- une `organization` possede plusieurs `clients`
- un `client` possede plusieurs `quotes` et `invoices`
- un `quote` possede plusieurs `quote_items`
- un `invoice` possede plusieurs `invoice_items`
- une `invoice` peut avoir plusieurs `invoice_payments`
- une `reminder` pointe vers un `quote` ou une `invoice`
- une `organization` possede une `subscription`

## Fichiers

- `supabase/schema.sql` : schema principal
- `supabase/rls.sql` : politiques de securite RLS

## Suite recommandee

1. creer le projet Supabase
2. executer `schema.sql`
3. executer `rls.sql`
4. brancher l'auth Supabase dans Next.js
5. creer les ecrans de connexion et d'onboarding
6. connecter les pages clients, devis et factures au vrai backend
