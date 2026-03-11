"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { imageUploadManager } from "@/lib/image-upload-manager"
import { Upload, X, CheckCircle } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (url: string, name: string) => void
  category?: "product" | "promo" | "general"
  maxSize?: number // em MB
  acceptedFormats?: string[]
}

export function ImageUpload({
  onImageUpload,
  category = "general",
  maxSize = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError("")
    setSuccess(false)

    // Validação de tipo
    if (!acceptedFormats.includes(file.type)) {
      setError(`Formato não suportado. Aceitos: ${acceptedFormats.join(", ")}`)
      return
    }

    // Validação de tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`)
      return
    }

    try {
      setIsUploading(true)

      // Gera preview
      const dataUrl = await imageUploadManager.fileToDataUrl(file)
      setPreview(dataUrl)
      setFileName(file.name)

      // Faz upload
      // Forçamos a categoria para garantir que ela seja passada corretamente
      const uploadCategory = category || "general";
      console.log(`[ImageUpload] Iniciando upload para categoria: ${uploadCategory}`);
      
      const result = await imageUploadManager.uploadImage(file, uploadCategory)
      console.log(`[ImageUpload] Upload concluído:`, result);

      // Callback com a URL da imagem
      onImageUpload(result.url, result.name)
      setSuccess(true)

      // Limpa o input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Remove mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
      setPreview(null)
      setFileName("")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearPreview = () => {
    setPreview(null)
    setFileName("")
    setError("")
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-300 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="image-upload-input"
        />

        {!preview ? (
          <label htmlFor="image-upload-input" className="cursor-pointer block">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Clique para fazer upload</p>
                <p className="text-sm text-gray-500">ou arraste a imagem aqui</p>
              </div>
              <p className="text-xs text-gray-400">
                Máximo {maxSize}MB • Formatos: JPG, PNG, WebP
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded-xl"
            />
            <p className="text-sm font-medium text-gray-700">{fileName}</p>
            {!success && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearPreview}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4 mr-2" /> Remover
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Imagem enviada com sucesso!</p>
        </div>
      )}

      {isUploading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700 font-medium">Enviando imagem...</p>
        </div>
      )}
    </div>
  )
}
