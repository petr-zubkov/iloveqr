'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Download, Upload, Image as ImageIcon, Palette, Settings } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'

export default function Home() {
  const [text, setText] = useState('https://example.com')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [qrSize, setQrSize] = useState([300])
  const [qrColor, setQrColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [errorCorrection, setErrorCorrection] = useState('M')
  const [logoSize, setLogoSize] = useState([30])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedShape, setSelectedShape] = useState('circle')
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateQRCode = async () => {
    if (!text.trim()) {
      toast.error('Please enter text or URL')
      return
    }

    setIsGenerating(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Generate basic QR code
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: qrSize[0],
        margin: 2,
        color: {
          dark: qrColor,
          light: backgroundColor
        },
        errorCorrectionLevel: errorCorrection as 'L' | 'M' | 'Q' | 'H'
      })

      const img = new Image()
      img.onload = () => {
        canvas.width = qrSize[0]
        canvas.height = qrSize[0]
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Draw QR code
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Draw logo if selected
        if (selectedImage && imagePreview) {
          const logoImg = new Image()
          logoImg.onload = () => {
            const logoWidth = (canvas.width * logoSize[0]) / 100
            const logoHeight = (canvas.height * logoSize[0]) / 100
            const x = (canvas.width - logoWidth) / 2
            const y = (canvas.height - logoHeight) / 2
            
            // Create clipping path based on selected shape
            ctx.save()
            ctx.beginPath()
            
            switch (selectedShape) {
              case 'circle':
                ctx.arc(canvas.width / 2, canvas.height / 2, logoWidth / 2, 0, 2 * Math.PI)
                break
              case 'square':
                ctx.rect(x, y, logoWidth, logoHeight)
                break
              case 'rounded':
                const radius = logoWidth * 0.1
                if (ctx.roundRect) {
                  ctx.roundRect(x, y, logoWidth, logoHeight, radius)
                } else {
                  // Fallback for browsers that don't support roundRect
                  ctx.moveTo(x + radius, y)
                  ctx.lineTo(x + logoWidth - radius, y)
                  ctx.quadraticCurveTo(x + logoWidth, y, x + logoWidth, y + radius)
                  ctx.lineTo(x + logoWidth, y + logoHeight - radius)
                  ctx.quadraticCurveTo(x + logoWidth, y + logoHeight, x + logoWidth - radius, y + logoHeight)
                  ctx.lineTo(x + radius, y + logoHeight)
                  ctx.quadraticCurveTo(x, y + logoHeight, x, y + logoHeight - radius)
                  ctx.lineTo(x, y + radius)
                  ctx.quadraticCurveTo(x, y, x + radius, y)
                }
                break
              case 'diamond':
                ctx.moveTo(canvas.width / 2, y)
                ctx.lineTo(x + logoWidth, canvas.height / 2)
                ctx.lineTo(canvas.width / 2, y + logoHeight)
                ctx.lineTo(x, canvas.height / 2)
                ctx.closePath()
                break
              case 'heart':
                const heartSize = logoWidth / 2
                const centerX = canvas.width / 2
                const centerY = canvas.height / 2
                ctx.moveTo(centerX, centerY + heartSize * 0.3)
                ctx.bezierCurveTo(centerX + heartSize * 0.5, centerY - heartSize * 0.3, centerX + heartSize, centerY + heartSize * 0.1, centerX, centerY + heartSize * 0.7)
                ctx.bezierCurveTo(centerX - heartSize, centerY + heartSize * 0.1, centerX - heartSize * 0.5, centerY - heartSize * 0.3, centerX, centerY + heartSize * 0.3)
                break
              default:
                ctx.arc(canvas.width / 2, canvas.height / 2, logoWidth / 2, 0, 2 * Math.PI)
            }
            
            ctx.clip()
            ctx.drawImage(logoImg, x, y, logoWidth, logoHeight)
            ctx.restore()
            
            // Apply template effects
            if (selectedTemplate !== 'none') {
              applyTemplateEffect(ctx, canvas.width, canvas.height)
            }
            
            setQrCodeDataUrl(canvas.toDataURL())
            setIsGenerating(false)
          }
          logoImg.src = imagePreview
        } else {
          // Apply template effects even without logo
          if (selectedTemplate !== 'none') {
            applyTemplateEffect(ctx, canvas.width, canvas.height)
          }
          setQrCodeDataUrl(canvas.toDataURL())
          setIsGenerating(false)
        }
      }
      img.src = qrDataUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
      setIsGenerating(false)
    }
  }

  const applyTemplateEffect = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    switch (selectedTemplate) {
      case 'gradient':
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2)
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)')
        gradient.addColorStop(1, 'rgba(255,255,255,0.1)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
        break
      case 'dots':
        ctx.globalCompositeOperation = 'source-atop'
        for (let i = 0; i < width; i += 8) {
          for (let j = 0; j < height; j += 8) {
            ctx.beginPath()
            ctx.arc(i, j, 2, 0, 2 * Math.PI)
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`
            ctx.fill()
          }
        }
        ctx.globalCompositeOperation = 'source-over'
        break
      case 'frame':
        ctx.strokeStyle = qrColor
        ctx.lineWidth = 4
        ctx.strokeRect(10, 10, width - 20, height - 20)
        break
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) {
      toast.error('Please generate a QR code first')
      return
    }

    const link = document.createElement('a')
    link.download = 'iloveqr-code.png'
    link.href = qrCodeDataUrl
    link.click()
  }

  useEffect(() => {
    generateQRCode()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            I Love QR
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create beautiful, customized QR codes with your own images
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  QR Code Settings
                </CardTitle>
                <CardDescription>
                  Customize your QR code with text, colors, and images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="text">Text or URL</Label>
                  <Input
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text or URL to encode"
                  />
                </div>

                <div className="space-y-2">
                  <Label>QR Code Size: {qrSize[0]}px</Label>
                  <Slider
                    value={qrSize}
                    onValueChange={setQrSize}
                    max={800}
                    min={200}
                    step={50}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrColor">QR Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="qrColor"
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Error Correction Level</Label>
                  <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedImage && (
                  <div className="space-y-2">
                    <Label>Logo Shape</Label>
                    <Select value={selectedShape} onValueChange={setSelectedShape}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="rounded">Rounded Square</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="heart">Heart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Template Effect</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="gradient">Gradient Overlay</SelectItem>
                      <SelectItem value="dots">Dot Pattern</SelectItem>
                      <SelectItem value="frame">Decorative Frame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={generateQRCode} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Quick Templates
                </CardTitle>
                <CardDescription>
                  Try these pre-designed styles for instant results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrColor('#000000')
                      setBackgroundColor('#FFFFFF')
                      setSelectedTemplate('none')
                      generateQRCode()
                    }}
                    className="text-xs"
                  >
                    Classic
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrColor('#7C3AED')
                      setBackgroundColor('#F3E8FF')
                      setSelectedTemplate('gradient')
                      generateQRCode()
                    }}
                    className="text-xs"
                  >
                    Purple Dream
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrColor('#DC2626')
                      setBackgroundColor('#FEE2E2')
                      setSelectedTemplate('frame')
                      generateQRCode()
                    }}
                    className="text-xs"
                  >
                    Red Alert
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQrColor('#059669')
                      setBackgroundColor('#D1FAE5')
                      setSelectedTemplate('dots')
                      generateQRCode()
                    }}
                    className="text-xs"
                  >
                    Nature
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Add Logo/Image
                </CardTitle>
                <CardDescription>
                  Upload an image to place in the center of your QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Click to upload an image
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {imagePreview && (
                  <div className="space-y-2">
                    <Label>Logo Size: {logoSize[0]}%</Label>
                    <Slider
                      value={logoSize}
                      onValueChange={setLogoSize}
                      max={50}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Selected logo"
                        className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview('')
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="w-full"
                    >
                      Remove Logo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Your customized QR code will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {qrCodeDataUrl ? (
                    <div className="text-center space-y-4">
                      <img
                        src={qrCodeDataUrl}
                        alt="Generated QR Code"
                        className="mx-auto border border-gray-200 rounded-lg shadow-lg"
                        style={{ width: qrSize[0], height: qrSize[0] }}
                      />
                      <Button onClick={downloadQRCode} className="flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Download QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                      <p>Generate your QR code to see preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>• Higher error correction levels allow for more complex logos but make QR codes denser</p>
                <p>• Keep logos simple and high-contrast for best results</p>
                <p>• Test your QR code with multiple scanners before using</p>
                <p>• Avoid placing logos over the three corner squares of the QR code</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}