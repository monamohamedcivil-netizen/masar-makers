# Masar Makers Database Rules

## Never

- Never create tables from SQL Editor.
- Never create policies manually.
- Never create indexes manually.
- Never modify schema manually.

## Always

1. Create Migration.
2. Run:

npx --yes supabase db push

3. Commit Migration.

## Migration Order

1. Tables
2. Constraints
3. Indexes
4. RLS
5. Policies
6. Triggers
7. Seed (optional)