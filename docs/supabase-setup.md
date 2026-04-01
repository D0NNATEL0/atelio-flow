# Setup Supabase

## Variables d'environnement

Creer un fichier `.env.local` a la racine du projet avec :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Un fichier exemple est deja disponible dans `.env.example`.

## Etapes recommandees

1. creer un projet Supabase
2. executer `supabase/schema.sql`
3. executer `supabase/rls.sql`
4. activer les providers `Google` et `Apple` dans Supabase Auth
5. renseigner `.env.local`
6. relancer `npm run dev`

## Parcours deja prepares dans l'app

- `/auth/login`
- `/auth/signup`
- `/onboarding`

## Note

Les formulaires d'auth sont deja prets cote interface. La prochaine etape sera de connecter les donnees utilisateur et l'onboarding aux tables `profiles` et `organizations`.
