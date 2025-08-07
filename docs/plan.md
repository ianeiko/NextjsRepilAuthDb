# Complete Next.js Fullstack Application Setup on Replit

This comprehensive guide walks through creating a production-ready Next.js application with Replit Auth, PostgreSQL database, shadcn/ui components, and proper deployment configuration - all set up manually without using Replit Agent.

## Project initialization and basic setup

**Start with the official Next.js template** to ensure optimal Replit compatibility. In your Replit workspace, create a new project using the Next.js template or fork from `https://github.com/nextjs/deploy-replit`.

For manual setup, run these commands in the Replit shell:

```bash
npx create-next-app@latest my-fullstack-app
```

Select these recommended options during setup:
- **TypeScript**: Yes
- **ESLint**: Yes
- **Tailwind CSS**: Yes (required for shadcn/ui)
- **src/ directory**: Yes
- **App Router**: Yes (recommended for React 19 support)
- **Turbopack**: No (can cause deployment issues)
- **Import alias**: No - @/* (required for shadcn/ui)

Navigate to your project and install core dependencies:

```bash
cd my-fullstack-app
npm install @next/env dotenv
```

## Configure Replit-specific files

### Create .replit configuration file

```toml
# .replit
entrypoint = "src/app/page.tsx"
modules = ["nodejs-20"]

[nix]
channel = "stable-23_11"

[deployment]
build = "npm run build"
run = "npm start"
deploymentTarget = "cloudrun"

# Port configuration
[[ports]]
localPort = 3000
externalPort = 80

[env]
NODE_ENV = "production"

[packager]
language = "nodejs"

[packager.features]
packageSearch = true
guessImports = true

[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"
```

### Create replit.nix for system dependencies

```nix
# replit.nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
  ];
}
```

### Update package.json scripts

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p ${PORT:-3000}",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  }
}
```

## Set up shadcn/ui components

Install and configure shadcn/ui for your component library:

```bash
npx shadcn@latest init
```

During configuration, select:
- **Style**: New York (recommended)
- **Base color**: Slate
- **CSS variables**: Yes
- **Framework**: Next.js
- **TypeScript**: Yes
- **Global CSS**: `src/app/globals.css`
- **Components directory**: `@/components`
- **Utils directory**: `@/lib/utils`

Install core shadcn/ui components:

```bash
npx shadcn@latest add button card input dialog form label
```

The init command automatically creates essential configuration files, but verify your `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

## Configure Replit PostgreSQL database with Drizzle

### Set up database in Replit workspace

1. Click the **Database** icon in the Tools pane
2. Select **Create a database**
3. The PostgreSQL 15 database provisions instantly (powered by Neon)
4. Note the automatically generated environment variables

### Install Drizzle ORM packages

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit @types/node
```

### Configure Drizzle

Create `drizzle.config.ts` in the root directory:

```typescript
import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
```

### Define database schema

Create `src/db/schema.ts`:

```typescript
import { pgTable, text, boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  authorId: uuid('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))

// Type exports for TypeScript
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
```

### Create database client

Create `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
```

### Update package.json scripts

Add Drizzle commands to your scripts:

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p ${PORT:-3000}",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

### Run database migrations

Generate and run migrations:

```bash
npm run db:generate
npm run db:push
```

### Optional: Create seed file

Create `src/db/seed.ts` for sample data:

```typescript
import { db } from './index'
import { users, posts } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Insert sample user
  const [user] = await db.insert(users).values({
    email: 'demo@example.com',
    name: 'Demo User',
  }).returning()

  // Insert sample posts
  await db.insert(posts).values([
    {
      title: 'First Post',
      content: 'This is my first post using Drizzle ORM!',
      authorId: user.id,
      published: true,
    },
    {
      title: 'Draft Post',
      content: 'This post is still in draft.',
      authorId: user.id,
      published: false,
    },
  ])

  console.log('Database seeded!')
}

seed().catch(console.error)

## Integrate Replit Auth with NextAuth.js

The 2024 Replit Auth system uses OpenID Connect. Install NextAuth.js:

```bash
npm install next-auth @auth/prisma-adapter
```

### Create auth configuration

Create `src/auth/config.ts`:

```typescript
import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export default {
  adapter: PrismaAdapter(prisma),
  providers: [{
    id: "replit",
    name: "Replit",
    type: "oidc",
    issuer: "https://replit.com",
    clientId: process.env.REPLIT_CLIENT_ID!,
    clientSecret: process.env.REPLIT_CLIENT_SECRET!,
    wellKnown: "https://replit.com/.well-known/openid-configuration",
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      }
    },
  }],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
} satisfies NextAuthConfig
```

Create auth handler at `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import authConfig from "@/auth/config"

const handler = NextAuth(authConfig)

export { handler as GET, handler as POST }
```

### Add session provider

Update `src/app/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Create authentication components

Create `src/components/auth/login-button.tsx`:

```typescript
"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p>Hello, {session.user?.name}</p>
        <Button onClick={() => signOut()}>Sign out</Button>
      </div>
    )
  }

  return (
    <Button onClick={() => signIn("replit")}>
      Sign in with Replit
    </Button>
  )
}
```

## Environment variable configuration

### Set up Replit Secrets

In your Replit workspace, go to **Tools** → **Secrets** and add:

```bash
# Replit Auth (automatically generated when auth is configured)
REPLIT_CLIENT_ID=your-client-id
REPLIT_CLIENT_SECRET=your-client-secret

# Database (automatically generated when database is created)
DATABASE_URL=postgresql://username:password@hostname:port/database

# NextAuth
NEXTAUTH_SECRET=generate-a-strong-secret-key
NEXTAUTH_URL=https://your-app.replit.app

# For development
REPLIT_DEV_DOMAIN=your-app.your-username.replit.dev
```

### Local development setup

For local development, create `.env.local`:

```bash
DATABASE_URL="postgresql://localhost:5432/localdb"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret"

# Note: Replit Auth only works in Replit environment
# Use alternative auth providers for local development
```

## Configure Next.js for optimal Replit compatibility

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for better Replit compatibility
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Image optimization
  images: {
    domains: ['replit.com', 'your-domain.com'],
    loader: process.env.NODE_ENV === 'production' ? 'custom' : 'default',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },

  // Webpack config for serverless compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
```

## Build a sample application

Create a complete example at `src/app/page.tsx`:

```typescript
import { LoginButton } from "@/components/auth/login-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Next.js Fullstack on Replit
          </h1>
          <p className="text-muted-foreground mb-6">
            Complete setup with Auth, Database, and Components
          </p>
          <LoginButton />
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🔐 Replit Auth</CardTitle>
            </CardHeader>
            <CardContent>
              <p>OpenID Connect authentication with automatic user management.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🗄️ PostgreSQL DB</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Serverless PostgreSQL database with Prisma ORM integration.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎨 shadcn/ui</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Beautiful, customizable components built on Radix UI.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
```

Create API route for database operations at `src/app/api/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import authConfig from '@/auth/config'

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(posts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content } = await request.json()

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: session.user.id
      }
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
```

## Deployment configuration and testing

### Test local development

Run your application locally in Replit:

```bash
npm run dev
```

The development server starts on port 3000 with automatic preview in Replit.

### Configure deployment

1. In your Replit workspace, click **Deploy**
2. Choose **Autoscale** deployment type
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Run command**: `npm start`
   - **Machine type**: 1vCPU, 2 GiB RAM
4. Add deployment secrets (same as development secrets but with production URLs)
5. Click **Deploy**

### Environment considerations

**Development URLs**:
- `https://your-app.your-username.replit.dev`

**Production URLs**:
- `https://your-app.replit.app`
- Custom domain support available

## Troubleshooting common issues

### Authentication problems

**Issue**: "Invalid redirect URI" errors
**Solution**: Ensure callback URLs match exactly:
- Development: `https://your-app.your-username.replit.dev/api/auth/callback/replit`
- Production: `https://your-app.replit.app/api/auth/callback/replit`

### Database connection issues

**Issue**: Connection timeouts or errors
**Solution**:
1. Verify `DATABASE_URL` is set correctly in Secrets
2. Check that database is active (databases sleep after 5 minutes of inactivity)
3. Test connection with a simple query

### Build failures

**Issue**: TypeScript or build errors during deployment
**Solution**:
1. Run `npm run build` locally first
2. Check that all dependencies are in `dependencies`, not `devDependencies`
3. Verify TypeScript configuration is correct

### Component styling issues

**Issue**: shadcn/ui components appear unstyled
**Solution**:
1. Verify Tailwind CSS is properly configured
2. Check that CSS variables are loaded in `globals.css`
3. Ensure `components.json` configuration matches your file structure

## Production optimization checklist

Before going live, ensure:

- ✅ Environment variables configured for production
- ✅ Database migrations applied and tested
- ✅ Authentication flows working correctly
- ✅ Error handling implemented in API routes
- ✅ Security headers configured
- ✅ Image optimization configured
- ✅ Database connection pooling optimized
- ✅ Monitoring and logging setup
- ✅ Backup strategy for database

This complete setup provides a production-ready Next.js fullstack application with modern authentication, database integration, beautiful UI components, and optimized deployment on Replit's infrastructure. The manual configuration ensures you understand each component and can customize the setup for your specific needs.