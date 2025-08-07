import { db } from './index'
import { users, posts } from './schema'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('Seeding database...')

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, 'demo@example.com')).limit(1)

  let user
  if (existingUser.length > 0) {
    console.log('User already exists, using existing user')
    user = existingUser[0]
  } else {
    // Insert sample user
    const [newUser] = await db.insert(users).values({
      email: 'demo@example.com',
      name: 'Demo User',
    }).returning()
    user = newUser
  }

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
  process.exit(0)
}

seed().catch(console.error)