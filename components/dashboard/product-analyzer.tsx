"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  Camera,
  AlertTriangle,
  CheckCircle,
  History,
  Trash2,
  Apple,
  Droplets,
  FileText,
  Save,
} from "lucide-react"
import { useDropzone } from "react-dropzone"

interface AnalysisResult {
  id: string
  analysis_type: "food_label" | "skincare_label" | "raw_product"
  product_name: string
  skin_compatibility_score: number
  detected_items: string[]
  skin_benefits: string[]
  warnings: string[]
  recommendations: string
  alternatives?: string[]
  usage_notes?: string[]
  product_type_identified?: string
  timestamp: Date
}

export function ProductAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisType, setAnalysisType] = useState<"food_label" | "skincare_label" | "raw_product">("food_label")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState("")

  // Load analysis history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("productAnalysisHistory")
      if (savedHistory) {
        const history = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setAnalysisHistory(history)
      }

      // Load current analysis if exists
      const savedAnalysis = localStorage.getItem("currentProductAnalysis")
      if (savedAnalysis) {
        const analysis = JSON.parse(savedAnalysis)
        setAnalysisResult({
          ...analysis,
          timestamp: new Date(analysis.timestamp),
        })
      }

      // Load analysis type
      const savedAnalysisType = localStorage.getItem("selectedAnalysisType")
      if (savedAnalysisType && ["food_label", "skincare_label", "raw_product"].includes(savedAnalysisType)) {
        setAnalysisType(savedAnalysisType as "food_label" | "skincare_label" | "raw_product")
      }
    } catch (error) {
      console.warn("Failed to load saved data:", error)
    }
  }, [])

  // Save to localStorage whenever analysis result changes
  useEffect(() => {
    try {
      if (analysisResult) {
        localStorage.setItem("currentProductAnalysis", JSON.stringify(analysisResult))
      }
    } catch (error) {
      console.warn("Failed to save analysis result:", error)
    }
  }, [analysisResult])

  // Save analysis type to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("selectedAnalysisType", analysisType)
    } catch (error) {
      console.warn("Failed to save analysis type:", error)
    }
  }, [analysisType])

  // Save history to localStorage
  useEffect(() => {
    try {
      if (analysisHistory.length > 0) {
        localStorage.setItem("productAnalysisHistory", JSON.stringify(analysisHistory))
      }
    } catch (error) {
      console.warn("Failed to save analysis history:", error)
    }
  }, [analysisHistory])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
      setAnalysisResult(null)
      setError("")
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  })

  const handleAnalyze = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("image", uploadedFile)
      formData.append("analysis_type", analysisType)

      const response = await fetch("/api/analyze-product-specialized", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const analysisWithId: AnalysisResult = {
          ...result,
          id: Date.now().toString(),
          analysis_type: analysisType,
          timestamp: new Date(),
        }

        setAnalysisResult(analysisWithId)
      } else {
        const errorData = await response.json()
        console.error("Analysis failed:", errorData)
        setError(errorData.error || "Analysis failed. Please try again.")
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setError("Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveToJournal = () => {
    if (analysisResult) {
      try {
        // Add to history
        setAnalysisHistory((prev) => [analysisResult, ...prev.slice(0, 19)]) // Keep last 20 analyses

        // Show success message
        alert("Analysis saved to your Skin Journal!")
      } catch (error) {
        console.warn("Failed to save to journal:", error)
        alert("Failed to save analysis. Please try again.")
      }
    }
  }

  const clearCurrentAnalysis = () => {
    try {
      setAnalysisResult(null)
      setUploadedFile(null)
      setError("")
      localStorage.removeItem("currentProductAnalysis")
    } catch (error) {
      console.warn("Failed to clear analysis:", error)
    }
  }

  const clearHistory = () => {
    try {
      setAnalysisHistory([])
      localStorage.removeItem("productAnalysisHistory")
    } catch (error) {
      console.warn("Failed to clear history:", error)
    }
  }

  const loadFromHistory = (analysis: AnalysisResult) => {
    try {
      setAnalysisResult(analysis)
      setAnalysisType(analysis.analysis_type)
      setShowHistory(false)
    } catch (error) {
      console.warn("Failed to load from history:", error)
    }
  }

  const getAnalysisTypeInfo = (type: string) => {
    switch (type) {
      case "food_label":
        return { icon: FileText, label: "Food Label", color: "bg-green-500" }
      case "skincare_label":
        return { icon: Droplets, label: "Skincare Label", color: "bg-purple-500" }
      case "raw_product":
        return { icon: Apple, label: "Raw Product", color: "bg-orange-500" }
      default:
        return { icon: Scan, label: "Analysis", color: "bg-blue-500" }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    if (score >= 40) return "text-orange-600 bg-orange-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-blue-600" />
            <span>Product Analyzer</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History ({analysisHistory.length})
            </Button>
            {analysisResult && (
              <Button size="sm" variant="outline" onClick={clearCurrentAnalysis}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">Choose analysis type and upload photo for AI-powered insights</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* History Panel */}
        {showHistory && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Analysis History</h3>
              {analysisHistory.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearHistory} className="text-red-600">
                  Clear All
                </Button>
              )}
            </div>
            {analysisHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No previous analyses</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {analysisHistory.map((analysis) => {
                  const typeInfo = getAnalysisTypeInfo(analysis.analysis_type)
                  return (
                    <button
                      key={analysis.id}
                      onClick={() => loadFromHistory(analysis)}
                      className="w-full text-left p-2 rounded border hover:bg-white transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${typeInfo.color}`}></div>
                          <div>
                            <p className="font-medium text-sm">{analysis.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {typeInfo.label} • Score: {analysis.skin_compatibility_score}/100
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {analysis.timestamp?.toLocaleDateString?.() || "Unknown date"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
        )}

        {/* Analysis Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant={analysisType === "food_label" ? "default" : "outline"}
            onClick={() => setAnalysisType("food_label")}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <FileText className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">🧃 Analyze Food Label</div>
              <div className="text-xs opacity-75">Photo of Nutrition Label</div>
            </div>
          </Button>

          <Button
            variant={analysisType === "skincare_label" ? "default" : "outline"}
            onClick={() => setAnalysisType("skincare_label")}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Droplets className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">🧴 Analyze Skincare Label</div>
              <div className="text-xs opacity-75">Photo of Ingredients</div>
            </div>
          </Button>

          <Button
            variant={analysisType === "raw_product" ? "default" : "outline"}
            onClick={() => setAnalysisType("raw_product")}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <Apple className="w-6 h-6" />
            <div className="text-center">
              <div className="font-medium">🍎 Analyze Raw Product</div>
              <div className="text-xs opacity-75">Photo of Whole Food/Dish/Cosmetic</div>
            </div>
          </Button>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <input {...getInputProps()} />

          {uploadedFile ? (
            <div className="space-y-2">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-gray-600">Ready to analyze</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Camera className="w-12 h-12 text-gray-400 mx-auto" />
              <p className="font-medium">Drop image or click to upload</p>
              <p className="text-sm text-gray-600">
                {analysisType === "food_label" && "Take a clear photo of the nutrition label"}
                {analysisType === "skincare_label" && "Take a clear photo of the ingredients list"}
                {analysisType === "raw_product" && "Take a photo of the whole product"}
              </p>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <Button onClick={handleAnalyze} disabled={!uploadedFile || isAnalyzing} className="w-full">
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4 mr-2" />
              Analyze {getAnalysisTypeInfo(analysisType).label}
            </>
          )}
        </Button>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Header with Score */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{analysisResult.product_name}</h3>
                {analysisResult.product_type_identified && (
                  <p className="text-sm text-gray-600">Identified: {analysisResult.product_type_identified}</p>
                )}
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${getScoreColor(analysisResult.skin_compatibility_score)}`}
                >
                  {analysisResult.analysis_type === "food_label" && "🧃"}
                  {analysisResult.analysis_type === "skincare_label" && "💄"}
                  {analysisResult.analysis_type === "raw_product" && "🍎"}
                  <span className="ml-1">
                    {analysisResult.analysis_type === "skincare_label" ? "Safety" : "Skin"} Score:{" "}
                    {analysisResult.skin_compatibility_score}/100
                  </span>
                </div>
                <Badge variant="outline" className="text-xs mt-1">
                  {getAnalysisTypeInfo(analysisResult.analysis_type).label}
                </Badge>
              </div>
            </div>

            {/* Detected Items */}
            {analysisResult.detected_items && analysisResult.detected_items.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-1">
                  <span>🔬</span>
                  <span>
                    {analysisResult.analysis_type === "food_label" && "Detected Nutrients & Ingredients"}
                    {analysisResult.analysis_type === "skincare_label" && "Detected Ingredients"}
                    {analysisResult.analysis_type === "raw_product" && "Typical Ingredients (Estimated)"}
                  </span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.detected_items.map((item: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Benefits */}
            {analysisResult.skin_benefits && analysisResult.skin_benefits.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-1">
                  <span>❤️</span>
                  <span>Skin Benefits</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysisResult.skin_benefits.map((benefit: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {analysisResult.warnings && analysisResult.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{analysisResult.analysis_type === "skincare_label" ? "Risks" : "Warnings"}</span>
                </h4>
                <div className="space-y-1">
                  {analysisResult.warnings.map((warning: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 text-sm text-orange-700 bg-orange-50 p-2 rounded"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage Notes (for skincare) */}
            {analysisResult.usage_notes && analysisResult.usage_notes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-1">
                  <span>💡</span>
                  <span>Usage Tips</span>
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {analysisResult.usage_notes.map((note: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 bg-blue-50 p-2 rounded">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-1">
                  <span>✅</span>
                  <span>Recommendations</span>
                </h4>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">{analysisResult.recommendations}</p>
              </div>
            )}

            {/* Alternatives */}
            {analysisResult.alternatives && analysisResult.alternatives.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Better Alternatives</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {analysisResult.alternatives.map((alternative: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                      <span>{alternative}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={saveToJournal} className="flex-1 bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save to Skin Journal
              </Button>
              <Button variant="outline" onClick={() => setUploadedFile(null)}>
                Re-analyze
              </Button>
            </div>

            <div className="text-xs text-gray-500 pt-2">
              Analyzed on {analysisResult.timestamp?.toLocaleString?.() || "Unknown date"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
