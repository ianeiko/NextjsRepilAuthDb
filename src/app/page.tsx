import { LoginButton } from "@/components/auth/login-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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