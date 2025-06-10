"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Target, Calendar, Trophy, Plus, Camera } from "lucide-react"

interface Challenge {
  id: number
  title: string
  description: string
  deadline: string
  progress: number
  status: "active" | "completed"
  reward: string
  skinIssue: string
  targetImprovement: number
  dailyRecommendations: string[]
  nextPhotoDate: string | null
}

const skinIssues = [
  { value: "acne", label: "Acne" },
  { value: "dryness", label: "Dryness" },
  { value: "oiliness", label: "Oiliness" },
  { value: "redness", label: "Redness" },
  { value: "dark_circles", label: "Dark Circles" },
  { value: "texture", label: "Texture Issues" },
  { value: "hyperpigmentation", label: "Hyperpigmentation" },
]

export function GlowChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [activeTab, setActiveTab] = useState("active")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    skinIssue: "",
    targetImprovement: 30,
    deadline: "",
    duration: 4,
  })

  // Load challenges from localStorage on component mount
  useEffect(() => {
    const savedChallenges = localStorage.getItem("glowChallenges")
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges))
    }
  }, [])

  // Save challenges to localStorage whenever challenges change
  useEffect(() => {
    if (challenges.length > 0) {
      localStorage.setItem("glowChallenges", JSON.stringify(challenges))
    }
  }, [challenges])

  const filteredChallenges = challenges.filter((challenge) =>
    activeTab === "all" ? true : challenge.status === activeTab,
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "active":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const handleCreateChallenge = () => {
    const challenge: Challenge = {
      id: Date.now(),
      title: newChallenge.title || `Improve ${newChallenge.skinIssue}`,
      description: `Reduce ${newChallenge.skinIssue} by ${newChallenge.targetImprovement}% in ${newChallenge.duration} weeks`,
      deadline: newChallenge.deadline,
      progress: 0,
      status: "active",
      reward: "Custom achievement badge",
      skinIssue: newChallenge.skinIssue,
      targetImprovement: newChallenge.targetImprovement,
      dailyRecommendations: getDailyRecommendations(newChallenge.skinIssue),
      nextPhotoDate: getNextPhotoDate(),
    }

    setChallenges((prev) => [challenge, ...prev])
    setIsCreateDialogOpen(false)
    setNewChallenge({
      title: "",
      skinIssue: "",
      targetImprovement: 30,
      deadline: "",
      duration: 4,
    })
  }

  const getDailyRecommendations = (skinIssue: string) => {
    const recommendations: Record<string, string[]> = {
      acne: ["Use salicylic acid cleanser", "Apply spot treatment", "Avoid touching your face", "Change pillowcase"],
      dryness: ["Apply hyaluronic acid serum", "Use a rich moisturizer", "Drink extra water", "Use a humidifier"],
      oiliness: ["Use oil-free cleanser", "Apply niacinamide serum", "Use blotting papers", "Avoid over-cleansing"],
      redness: [
        "Use gentle, fragrance-free products",
        "Apply cool compress",
        "Avoid spicy foods",
        "Use zinc oxide sunscreen",
      ],
    }
    return recommendations[skinIssue] || ["Follow your regular skincare routine"]
  }

  const getNextPhotoDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().split("T")[0]
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Glow Challenges</span>
            </CardTitle>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Challenge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Challenge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Challenge Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Clear Skin Journey"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="skinIssue">Skin Issue to Target</Label>
                    <Select
                      value={newChallenge.skinIssue}
                      onValueChange={(value) => setNewChallenge((prev) => ({ ...prev, skinIssue: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skin concern" />
                      </SelectTrigger>
                      <SelectContent>
                        {skinIssues.map((issue) => (
                          <SelectItem key={issue.value} value={issue.value}>
                            {issue.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="improvement">Target Improvement (%)</Label>
                    <Input
                      id="improvement"
                      type="number"
                      min="10"
                      max="90"
                      value={newChallenge.targetImprovement}
                      onChange={(e) =>
                        setNewChallenge((prev) => ({ ...prev, targetImprovement: Number.parseInt(e.target.value) }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (weeks)</Label>
                    <Select
                      value={newChallenge.duration.toString()}
                      onValueChange={(value) =>
                        setNewChallenge((prev) => ({ ...prev, duration: Number.parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 weeks</SelectItem>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="6">6 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                        <SelectItem value="12">12 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newChallenge.deadline}
                      onChange={(e) => setNewChallenge((prev) => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleCreateChallenge}
                    className="w-full"
                    disabled={!newChallenge.skinIssue || !newChallenge.deadline}
                  >
                    Create Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active challenges yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first challenge to start tracking your skin improvement goals
          </p>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Challenge
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-purple-600" />
            <span>Glow Challenges</span>
          </CardTitle>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Challenge Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Clear Skin Journey"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="skinIssue">Skin Issue to Target</Label>
                  <Select
                    value={newChallenge.skinIssue}
                    onValueChange={(value) => setNewChallenge((prev) => ({ ...prev, skinIssue: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skin concern" />
                    </SelectTrigger>
                    <SelectContent>
                      {skinIssues.map((issue) => (
                        <SelectItem key={issue.value} value={issue.value}>
                          {issue.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="improvement">Target Improvement (%)</Label>
                  <Input
                    id="improvement"
                    type="number"
                    min="10"
                    max="90"
                    value={newChallenge.targetImprovement}
                    onChange={(e) =>
                      setNewChallenge((prev) => ({ ...prev, targetImprovement: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Select
                    value={newChallenge.duration.toString()}
                    onValueChange={(value) =>
                      setNewChallenge((prev) => ({ ...prev, duration: Number.parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 weeks</SelectItem>
                      <SelectItem value="4">4 weeks</SelectItem>
                      <SelectItem value="6">6 weeks</SelectItem>
                      <SelectItem value="8">8 weeks</SelectItem>
                      <SelectItem value="12">12 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newChallenge.deadline}
                    onChange={(e) => setNewChallenge((prev) => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleCreateChallenge}
                  className="w-full"
                  disabled={!newChallenge.skinIssue || !newChallenge.deadline}
                >
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {["active", "completed", "all"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-purple-600 shadow-sm" : "text-gray-600 hover:text-purple-600"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-purple-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    challenge.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {challenge.status}
                </span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-gray-600">{challenge.progress}%</span>
                </div>
                <Progress value={challenge.progress} className="h-2" />
              </div>

              {/* Daily Recommendations */}
              {challenge.status === "active" && challenge.dailyRecommendations.length > 0 && (
                <div className="mb-3 p-3 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Today's Recommendations:</h4>
                  <ul className="text-xs text-purple-700 space-y-1">
                    {challenge.dailyRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Photo Upload */}
              {challenge.status === "active" && challenge.nextPhotoDate && (
                <div className="mb-3 p-2 bg-pink-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-pink-600" />
                    <span className="text-sm text-pink-800">Next photo: {challenge.nextPhotoDate}</span>
                  </div>
                  <Button size="sm" variant="outline" className="text-pink-600 border-pink-200">
                    Upload Now
                  </Button>
                </div>
              )}

              {/* Deadline and Reward */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {challenge.deadline}</span>
                </div>
                <div className="flex items-center space-x-1 text-purple-600">
                  <Trophy className="w-4 h-4" />
                  <span>{challenge.reward}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
