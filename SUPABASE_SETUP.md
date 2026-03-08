# Supabase Setup

1. Opprett et Supabase-prosjekt.
2. Gå til SQL Editor og kjør innholdet i `supabase.sql`.
3. Gå til `Project Settings` -> `API`.
4. Kopier prosjekt-URL og `publishable key`.
5. Fyll inn `url` og `publishableKey` i `config.js`.
6. Commit og push til GitHub Pages.

Hvis score ikke lagres, kjør SQL-en i `supabase.sql` pa nytt. Den gir `anon` og `authenticated` eksplisitt `select`- og `insert`-tilgang pa `public.scores`, i tillegg til RLS-policyene.

Leaderboarden lagres da i Supabase og blir ikke borte nar du oppdaterer spillet.
