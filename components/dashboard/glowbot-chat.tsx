"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, Sparkles, Trash2 } from "lucide-react"

interface SkinReport {
  date: string
  scores: {
    acne: number
    dryness: number
    oiliness: number
    redness: number
    darkCircles: number
    texture: number
  }
  image: string
  overall_score?: number
  skin_type?: string
  recommendations?: {
    skincare: string[]
    diet: string[]
    lifestyle: string[]
  }
}

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hi! I'm GlowBot, your personal AI skin coach. How can I help you achieve your best skin today?",
    sender: "bot",
    timestamp: new Date(),
  },
]

const SYSTEM_PROMPT = `You are GlowBot, a helpful and friendly skin care assistant. You always respond politely and informatively to the user's questions.
Base your answers on the latest skin analysis data you have for this user, including details about their skin type, concerns, and recommendations.
If no analysis data is available, politely inform the user and suggest uploading a photo for skin analysis.
Keep answers concise, supportive, and actionable.`

export function GlowBotChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [latestSkinReport, setLatestSkinReport] = useState<SkinReport | null>(null)
  const [isApiConfigured, setIsApiConfigured] = useState(true) // New state for API key check
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for API key on component mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_XAI_API_KEY
    if (!apiKey) {
      console.warn("CRITICAL: NEXT_PUBLIC_XAI_API_KEY is not set. GlowBot may not function correctly.")
      setIsApiConfigured(false)
      // Optionally, add a user-facing message to initialMessages or a new state
      // For now, we'll just log a warning and set the state.
    }
  }, [])

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("glowbotChatHistory")
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))
      setMessages(parsedMessages)
    }

    // Load input value
    const savedInput = localStorage.getItem("glowbotInputValue")
    if (savedInput) {
      setInputValue(savedInput)
    }
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 1) {
      // Don't save if only initial message
      localStorage.setItem("glowbotChatHistory", JSON.stringify(messages))
    }
  }, [messages])

  // Save input value to localStorage
  useEffect(() => {
    localStorage.setItem("glowbotInputValue", inputValue)
  }, [inputValue])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const currentInput = inputValue
    setInputValue("") // Clear input immediately

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Fetch latest skin report before sending message
    let fetchedReport: SkinReport | null = null
    try {
      const skinReportsString = localStorage.getItem("skinReports")
      if (skinReportsString) {
        const reports: SkinReport[] = JSON.parse(skinReportsString)
        if (reports && reports.length > 0) {
          fetchedReport = reports[0] // Assuming newest is first
          setLatestSkinReport(fetchedReport) // Update state, though we'll use fetchedReport directly for this call
          console.log("Latest skin report found for xAI call:", fetchedReport)
        } else {
          console.log("No skin reports found in localStorage for xAI call.")
        }
      } else {
        console.log("No 'skinReports' key found in localStorage for xAI call.")
      }
    } catch (error) {
      console.error("Error processing skin reports from localStorage for xAI call:", error)
    }

    if (!fetchedReport) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I don't have any skin analysis data for you yet. Please upload a photo for a skin analysis so I can provide personalized advice.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsTyping(false)
      return
    }

    // Format skin data for the prompt
    let formattedSkinData = `Skin Type: ${fetchedReport.skin_type || "Not specified"}. Overall Score: ${fetchedReport.overall_score || "Not available"}/100.`
    if (fetchedReport.scores) {
      formattedSkinData += ` Specific scores (out of 10) - Acne: ${fetchedReport.scores.acne}, Dryness: ${fetchedReport.scores.dryness}, Oiliness: ${fetchedReport.scores.oiliness}, Redness: ${fetchedReport.scores.redness}, Dark Circles: ${fetchedReport.scores.darkCircles}, Texture: ${fetchedReport.scores.texture}.`
    }
    if (fetchedReport.recommendations) {
      if (fetchedReport.recommendations.skincare?.length) {
        formattedSkinData += ` Skincare recommendations: ${fetchedReport.recommendations.skincare.join(", ")}.`
      }
      if (fetchedReport.recommendations.diet?.length) {
        formattedSkinData += ` Diet recommendations: ${fetchedReport.recommendations.diet.join(", ")}.`
      }
      if (fetchedReport.recommendations.lifestyle?.length) {
        formattedSkinData += ` Lifestyle recommendations: ${fetchedReport.recommendations.lifestyle.join(", ")}.`
      }
    }

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Here is my latest skin analysis data: ${formattedSkinData}. Now, please answer my question: ${userMessage.content}` }
    ];

    try {
      const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-1.5-flash-latest",
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!xaiResponse.ok) {
        const errorData = await xaiResponse.json()
        console.error("xAI API Error:", errorData)
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Sorry, I encountered an error trying to get a response. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      } else {
        const xaiResult = await xaiResponse.json()
        const botResponseContent = xaiResult.choices[0]?.message?.content
        if (botResponseContent) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: botResponseContent.trim(),
            sender: "bot",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, botMessage])
        } else {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Sorry, I received an empty response. Please try again.",
            sender: "bot",
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, botMessage])
        }
      }
    } catch (error) {
      console.error("Failed to fetch from xAI API:", error)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        // Updated user-friendly message
        content: "Sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages(initialMessages)
    setInputValue("")
    localStorage.removeItem("glowbotChatHistory")
    localStorage.removeItem("glowbotInputValue")
  }

  const quickQuestions = [
    "How can I reduce acne?",
    "Best routine for dry skin?",
    "Foods for healthy skin?",
    "How to fade dark spots?",
  ]

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <span>GlowBot - Your AI Skin Coach</span>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={clearChat} className="text-gray-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback
                    className={
                      message.sender === "bot"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gray-200"
                    }
                  >
                    {message.sender === "bot" ? <Sparkles className="w-4 h-4" /> : "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((question, index) => (
            <Button key={index} variant="outline" size="sm" onClick={() => setInputValue(question)} className="text-xs">
              {question}
            </Button>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isApiConfigured ? "Ask GlowBot anything about skincare..." : "GlowBot is currently unavailable."}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
            disabled={!isApiConfigured || isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || !isApiConfigured}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
