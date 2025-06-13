"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        // Safely check auth status
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.warn("Auth check error:", error.message)
          setIsAuthenticated(false)
          setUserEmail(null)
        } else {
          setIsAuthenticated(!!data.user)
          setUserEmail(data.user?.email || null)
        }
      } catch (error) {
        console.warn("Auth check failed:", error)
        setIsAuthenticated(false)
        setUserEmail(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth listener
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session)
        setUserEmail(session?.user?.email || null)
        setIsLoading(false)
      })

      return () => {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.warn("Subscription cleanup error:", error)
        }
      }
    } catch (error) {
      console.warn("Auth listener setup failed:", error)
      setIsLoading(false)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setUserEmail(null)
      // Redirect to home page after logout
      window.location.href = "/"
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              YouGlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#how-it-works" className="text-gray-600 hover:text-pink-600 transition-colors">
              How It Works
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-pink-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-pink-600 transition-colors">
              Pricing
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/quiz">
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full px-6 py-2 font-bold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse">
                🧪 Get Our Quiz
              </Button>
            </Link>
            {!isLoading && isAuthenticated && (
              <>
                {userEmail && <span className="text-sm text-gray-600">{userEmail}</span>}
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-600 hover:text-pink-600">
                    My Glow Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="text-gray-600 hover:text-pink-600" onClick={handleLogout}>
                  Log Out
                </Button>
              </>
            )}
            {!isLoading && !isAuthenticated && (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-pink-600">
                    Log In
                  </Button>
                </Link>
                <Link href="/#pricing">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-pink-100">
            <nav className="flex flex-col space-y-4">
              <Link href="#how-it-works" className="text-gray-600 hover:text-pink-600 transition-colors">
                How It Works
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-pink-600 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-pink-600 transition-colors">
                Pricing
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Link href="/quiz">
                  <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-full font-bold">
                    🧪 Get Our Quiz
                  </Button>
                </Link>
                {!isLoading && isAuthenticated && (
                  <>
                    {userEmail && <span className="block text-sm text-gray-600 px-4 py-2">{userEmail}</span>}
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full text-gray-600 hover:text-pink-600">
                        My Glow Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full text-gray-600 hover:text-pink-600" onClick={handleLogout}>
                      Log Out
                    </Button>
                  </>
                )}
                {!isLoading && !isAuthenticated && (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" className="w-full text-gray-600 hover:text-pink-600">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/#pricing">
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
