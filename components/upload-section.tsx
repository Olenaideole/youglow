"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Camera, ImageIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"

export function UploadSection() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

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
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false)
      // Redirect to results or show results
    }, 3000)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ready to Discover Your Glow?</h2>
          <p className="text-xl text-gray-600 mb-12">Upload your photo and get instant AI-powered skin analysis</p>

          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer ${
              isDragActive ? "border-pink-400 bg-pink-50" : "border-gray-300 hover:border-pink-400 hover:bg-pink-50/50"
            }`}
          >
            <input {...getInputProps()} />

            {uploadedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-gray-600">File uploaded successfully! Click analyze to continue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  {isDragActive ? <Upload className="w-8 h-8 text-white" /> : <Camera className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Drop your photo or take a selfie now</p>
                  <p className="text-gray-600">Supports JPG, PNG, WebP up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={!uploadedFile || isAnalyzing}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full px-8 py-4 text-lg font-semibold disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Get Your Skin Report"
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-4 text-lg border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
              onClick={() => setUploadedFile(null)}
            >
              <Camera className="w-5 h-5 mr-2" />
              Take New Photo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
