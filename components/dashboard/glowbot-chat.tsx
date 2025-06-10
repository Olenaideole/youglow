"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, Sparkles, Trash2 } from "lucide-react"

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

export function GlowBotChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("acne") || input.includes("pimple")) {
      return "For acne-prone skin, I recommend focusing on gentle cleansing, avoiding over-washing, and incorporating salicylic acid or benzoyl peroxide. Also, try reducing dairy and high-glycemic foods in your diet. Would you like specific product recommendations?"
    }

    if (input.includes("dry") || input.includes("moisture")) {
      return "Dry skin needs extra hydration! Use a gentle, cream-based cleanser and apply moisturizer while your skin is still damp. Look for ingredients like hyaluronic acid, ceramides, and glycerin. Don't forget to drink plenty of water too!"
    }

    if (input.includes("oily") || input.includes("greasy")) {
      return "Oily skin can be managed with the right routine! Use a gentle foaming cleanser, apply a lightweight, oil-free moisturizer, and consider niacinamide to regulate oil production. Avoid over-cleansing as it can make oiliness worse."
    }

    if (input.includes("routine") || input.includes("skincare")) {
      return "A basic skincare routine should include: 1) Gentle cleanser (AM/PM), 2) Moisturizer (AM/PM), 3) Sunscreen (AM), 4) Treatment products as needed. Start simple and gradually add products. What's your current routine like?"
    }

    if (input.includes("diet") || input.includes("food")) {
      return "Diet plays a huge role in skin health! Focus on anti-inflammatory foods like leafy greens, berries, fatty fish, and nuts. Limit sugar, dairy, and processed foods. Would you like me to suggest some skin-friendly recipes?"
    }

    return "That's a great question! Based on your skin analysis, I'd recommend focusing on consistency with your routine and being patient with results. Every skin journey is unique. Can you tell me more about your specific concerns so I can give you more targeted advice?"
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
            placeholder="Ask GlowBot anything about skincare..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
