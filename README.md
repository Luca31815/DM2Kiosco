# Dashboard Ventas

Minimalist dashboard for sales, purchases, and reservations management. Built with React, Vite, Tailwind CSS, and Supabase.

## Features
- **Ventas, Compras, Reservas**: Manage transactions with expandable details.
- **Reporting**: Daily, Weekly, and Monthly reports with visual summaries.
- **Dark Mode**: Sleek, modern UI.

## Deployment

### 1. Push to GitHub
Run the following commands in your terminal to push this project to a new GitHub repository:

```bash
# Create a new repository on GitHub (if you haven't already)
# Then link it:
git remote add origin https://github.com/Luca31815/DM2Kiosco.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `dashboard-ventas` repository from GitHub.
4.  **Environment Variables**:
    Add the following variables in the Vercel project settings (copy them from your `.env.local` or Supabase dashboard):
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
5.  Click **Deploy**.

## Local Development

```bash
npm install
npm run dev
```
