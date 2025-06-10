"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, TrendingUp, Calendar, Upload } from "lucide-react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"

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
  progress_comparison?: {
    improvement_areas: string[]
    areas_needing_attention: string[]
    overall_progress: "improved" | "stable" | "worsened"
    progress_percentage: number
  }
}

export function SkinReports() {
  const [reports, setReports] = useState<SkinReport[]>([])
  const [selectedReport, setSelectedReport] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [error, setError] = useState("")

  // Load reports from localStorage on component mount
  useEffect(() => {
    const savedReports = localStorage.getItem("skinReports")
    if (savedReports) {
      const parsedReports = JSON.parse(savedReports)
      setReports(parsedReports)
    }
  }, [])

  // Save reports to localStorage whenever reports change
  useEffect(() => {
    if (reports.length > 0) {
      localStorage.setItem("skinReports", JSON.stringify(reports))
    }
  }, [reports])

  const currentReport = reports[selectedReport]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  })

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", uploadedFile)

      // Include previous analysis for comparison if available
      if (reports.length > 0) {
        formData.append("previousAnalysis", JSON.stringify(reports[0]))
      }

      const response = await fetch("/api/analyze-skin", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()

        // Create new report
        const newReport: SkinReport = {
          date: new Date().toISOString().split("T")[0],
          scores: result.analysis,
          image: URL.createObjectURL(uploadedFile),
          overall_score: result.overall_score,
          skin_type: result.skin_type,
          recommendations: result.recommendations,
          progress_comparison: result.progress_comparison,
        }

        // Add new report to the beginning of the array
        setReports((prev) => [newReport, ...prev])
        setSelectedReport(0)
        setShowUpload(false)
        setUploadedFile(null)
      } else {
        const error = await response.json()
        console.error("Analysis failed:", error)
        setError("Analysis failed. Please try again.")
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      alert("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-green-600"
    if (score <= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score <= 3) return "bg-green-500"
    if (score <= 6) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (reports.length === 0 && !showUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-pink-600" />
            <span>My Skin Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No skin reports yet</h3>
          <p className="text-gray-600 mb-6">Upload your first photo to get started with AI-powered skin analysis</p>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Upload First Photo
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
            <Camera className="w-5 h-5 text-pink-600" />
            <span>My Skin Reports</span>
          </CardTitle>
          <Button
            size="sm"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Camera className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        {showUpload && (
          <div className="mb-6 p-4 border-2 border-dashed border-pink-200 rounded-lg bg-pink-50">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}
            <div
              {...getRootProps()}
              className={`p-6 text-center transition-all cursor-pointer rounded-lg ${
                isDragActive ? "bg-pink-100" : "hover:bg-pink-100"
              }`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-gray-600">Ready to analyze</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="w-8 h-8 text-pink-600 mx-auto" />
                  <p className="font-medium">Upload new skin photo</p>
                  <p className="text-sm text-gray-600">Drop image or click to upload</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAnalyze}
                disabled={!uploadedFile || isAnalyzing}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing with AI...
                  </>
                ) : (
                  "Analyze Photo"
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <>
            {/* Timeline */}
            <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
              {reports.map((report, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedReport(index)}
                  className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all ${
                    selectedReport === index ? "border-pink-400 bg-pink-50" : "border-gray-200 hover:border-pink-200"
                  }`}
                >
                  <Image
                    src={report.image || "/placeholder.svg"}
                    alt={`Report ${report.date}`}
                    width={60}
                    height={60}
                    className="rounded-lg mb-2"
                  />
                  <p className="text-xs text-gray-600">{report.date}</p>
                </button>
              ))}
            </div>

            {/* Current Report Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Image */}
              <div className="space-y-4">
                <Image
                  src={currentReport.image || "/placeholder.svg"}
                  alt="Current skin analysis"
                  width={300}
                  height={300}
                  className="rounded-lg w-full"
                />
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Analyzed on {currentReport.date}</span>
                </div>
                {currentReport.overall_score && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Overall Skin Health</span>
                      <span className="text-2xl font-bold text-blue-600">{currentReport.overall_score}/100</span>
                    </div>
                    {currentReport.skin_type && (
                      <p className="text-sm text-blue-700 mt-1">Skin Type: {currentReport.skin_type}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Scores */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Skin Analysis Results</h3>
                {Object.entries(currentReport.scores).map(([condition, score]) => (
                  <div key={condition} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="capitalize font-medium">{condition.replace(/([A-Z])/g, " $1")}</span>
                      <span className={`font-semibold ${getScoreColor(score)}`}>{score}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(score)}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Progress Comparison */}
                {currentReport.progress_comparison && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Progress Update</span>
                    </div>
                    <p className="text-sm text-green-700 mb-2">
                      Overall progress: {currentReport.progress_comparison.overall_progress} (
                      {currentReport.progress_comparison.progress_percentage > 0 ? "+" : ""}
                      {currentReport.progress_comparison.progress_percentage}%)
                    </p>
                    {currentReport.progress_comparison.improvement_areas.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-green-800">Improved areas:</p>
                        <p className="text-xs text-green-700">
                          {currentReport.progress_comparison.improvement_areas.join(", ")}
                        </p>
                      </div>
                    )}
                    {currentReport.progress_comparison.areas_needing_attention.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-orange-800">Areas needing attention:</p>
                        <p className="text-xs text-orange-700">
                          {currentReport.progress_comparison.areas_needing_attention.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {currentReport.recommendations && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Personalized Recommendations</h4>
                    {currentReport.recommendations.skincare && (
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <p className="text-sm font-medium text-pink-800 mb-1">Skincare:</p>
                        <ul className="text-xs text-pink-700 space-y-1">
                          {currentReport.recommendations.skincare.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentReport.recommendations.diet && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-1">Diet:</p>
                        <ul className="text-xs text-green-700 space-y-1">
                          {currentReport.recommendations.diet.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentReport.recommendations.lifestyle && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Lifestyle:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {currentReport.recommendations.lifestyle.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
