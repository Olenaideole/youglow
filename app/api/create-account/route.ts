import { type NextRequest, NextResponse } from "next/server"

// Mock function to generate random password
function generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Mock function to send email
async function sendCredentialsEmail(email: string, password: string, name: string) {
  // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
  console.log(`Sending credentials email to ${email}`)
  console.log(`Name: ${name}`)
  console.log(`Password: ${password}`)

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { success: true }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, planId } = await request.json()

    if (!email || !name || !planId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate random password
    const password = generatePassword()

    // In a real implementation, you would:
    // 1. Create user in database with hashed password
    // 2. Create subscription record
    // 3. Send welcome email with credentials

    // Mock user creation
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      password, // In real app, this would be hashed
      planId,
      createdAt: new Date().toISOString(),
    }

    // Send credentials email
    await sendCredentialsEmail(email, password, name)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Account creation error:", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
