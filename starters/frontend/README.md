This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install packages with `npm ci`. If `.env.local` does not exist, copy `.env.example` to `.env.local`. The tracked `.env.local` contains the shared demo project URL and public publishable key. These values are intentionally included for collaborators.

Client Components can use `createClient()` from `@/utils/supabase/client`. Backend helpers use the same public configuration and the caller's authenticated session. Supabase Row Level Security determines what each user can read or write; the public key does not grant access to other users' records. Apply the migrations and enable Anonymous Sign-Ins for the username demo (see [overhaul setup](../../OVERHAUL.md)).

Keep any administration key in ignored `.env.development.local` or `.env.production.local`, without a `NEXT_PUBLIC_` prefix. It is not used by the browser client. Restart development or rebuild after changing public environment variables.

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
