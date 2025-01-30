import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from './ui/card'
import { Upload } from 'lucide-react'

interface Props {
  onUpload: (file: File) => void
  reset?: boolean
}

export function ReceiptUploader({ onUpload, reset }: Props) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setPreview(URL.createObjectURL(file))
      onUpload(file)
    }
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  })

  // Reset the preview when reset prop changes
  useEffect(() => {
    if (reset && preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
  }, [reset, preview])

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  return (
    <Card
      {...getRootProps()}
      className="p-8 border-dashed border-2 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-gray-500">
        {preview ? (
          <img 
            src={preview} 
            alt="Receipt preview" 
            className="max-h-64 object-contain mb-2"
          />
        ) : (
          <>
            <Upload className="w-8 h-8 mb-2" />
            {isDragActive ? (
              <p>Drop the receipt here...</p>
            ) : (
              <p>Drag & drop a receipt, or click to select</p>
            )}
          </>
        )}
      </div>
    </Card>
  )
} 