import "./load-env"
import { eq } from "drizzle-orm"
import { db } from "./client"
import { user } from "./schema"

// Promotes an account to staff by email. This is how the first moderator is
// created, since staff roles are not self-serve. Run with:
//   npm run admin:grant -- someone@example.com
// Pass --revoke to demote back to a normal member.
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const revoke = args.includes("--revoke")
  const email = args.find((a) => !a.startsWith("--"))
  if (!email) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]")
    process.exit(1)
  }

  const role = revoke ? null : "admin"
  const [updated] = await db.update(user).set({ role }).where(eq(user.email, email)).returning({
    id: user.id,
    email: user.email,
    role: user.role,
  })
  if (!updated) {
    console.error(`No account with email ${email}.`)
    process.exit(1)
  }
  console.log(`${updated.email} is now ${updated.role ?? "a member"}.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
