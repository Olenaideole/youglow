"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sparkles, Settings, LogOut, User } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function DashboardHeader() {
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get real user data
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.warn("User fetch error:", error.message)
          // Use fallback values only if there's an error
          setUserEmail("user@example.com")
          setUserName("User")
        } else if (data.user) {
          setUserEmail(data.user.email || "")
          setUserName(data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User")
        } else {
          // No user found, redirect to login
          window.location.href = "/login"
        }
      } catch (error) {
        console.warn("User fetch failed:", error)
        // Use fallback values
        setUserEmail("user@example.com")
        setUserName("User")
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.warn("Logout error:", error)
      // Force redirect even if logout fails
      window.location.href = "/"
    }
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                YouGlow
              </span>
            </Link>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              YouGlow
            </span>
          </Link>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="font-medium">{userName}</div>
                    <div className="text-xs text-gray-500">{userEmail}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-red-600"
              title="Log Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
