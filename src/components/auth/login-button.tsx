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