# Atelio

Socle MVP web-first pour Atelio, une application de gestion commerciale destinee aux professionnels.

## Vision

Atelio aide les independants et petites structures a :

- creer des devis rapidement
- convertir un devis en facture
- centraliser les fiches client
- suivre les paiements
- relancer les devis ou factures en attente

## Stack recommandee

- `Next.js` pour le web
- `React Native / Expo` pour le mobile plus tard
- `Supabase` pour l'authentification, la base de donnees et le backend
- `Stripe` pour l'abonnement premium

## MVP v1

- authentification email, Google et Apple
- gestion des clients
- creation et suivi des devis
- conversion devis vers facture
- export PDF
- relances simples
- mode gratuit + offre premium

## Lancer le projet

1. Utiliser `Node 22` de preference
2. Installer les dependances avec `npm install`
3. Lancer le serveur avec `npm run dev`
4. Ouvrir `http://localhost:3000`

## Version Node recommandee

Le projet est prevu pour tourner avec une version LTS de Node, idealement `Node 22`.

Si vous utilisez `nvm` :

1. `nvm use`
2. sinon `nvm install 22`

## Suite recommandee

1. connecter Supabase
2. modeliser les tables `profiles`, `clients`, `quotes`, `invoices`, `reminders`, `subscriptions`
3. creer le flux d'authentification
4. implementer le CRUD clients
5. implementer devis puis factures
6. brancher Stripe et les plans premium

## Base de donnees

Le schema MVP est disponible ici :

- `supabase/schema.sql`
- `supabase/rls.sql`
- `docs/database.md`

## Authentification

Le socle d'auth et d'onboarding est pret dans :

- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/onboarding/page.tsx`
- `lib/supabase/client.ts`
- `docs/supabase-setup.md`
