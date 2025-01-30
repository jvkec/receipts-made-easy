'use client'

import { useState } from 'react'
import { ReceiptUploader } from '@/components/ReceiptUploader'
import { ReceiptsTable } from '@/components/ReceiptsTable'
import { ReceiptProcessor } from '@/components/ReceiptProcessor'
// import { ExtractedData } from '@/lib/imageProcessing'
// import axios from 'axios'
import { ExportButton } from '@/components/ExportButton'

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ReceiptItem {
  description: string;
  price: number;
  category: string;
}

interface Receipt {
  id: string;
  date: string;
  items: ReceiptItem[];
  tax: number;
  total: number;
}

interface UploadResponse {
  data: {
    id: number;
    date: string;
    items: ReceiptItem[];
    text: string;
    timestamp: string;
    vendor: string;
    amount: number;
    tax: number;
    total: number;
  };
}

export default function Home() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [resetUploader, setResetUploader] = useState(false)

  const handleUpload = (file: File) => {
    setCurrentFile(file)
    setResetUploader(false)
  }

  const handleProcessed = async (uploadResponse: UploadResponse) => {
    try {
      const newReceipt = {
        id: uploadResponse.data.id.toString(),
        date: uploadResponse.data.date || new Date().toLocaleDateString(),
        items: uploadResponse.data.items || [],
        tax: uploadResponse.data.tax || 0,
        total: uploadResponse.data.total || uploadResponse.data.amount || 0
      };

      setReceipts(prev => [newReceipt, ...prev]);
      setCurrentFile(null);
      setResetUploader(true);
    } catch (error) {
      console.error('Error processing receipt:', error);
    }
  }

  const handleInvalidReceipt = () => {
    setCurrentFile(null);
    setResetUploader(true);
  };

  return (
    <div className="min-h-screen bg-receipt-bg">
      <header className="receipt-header">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* <h1 className="text-2xl sm:text-3xl font-bold text-receipt-text">
            Receipt Scanner
          </h1> */}
          <div className="text-sm sm:text-base">
            Receipts Made Easy
          </div>
        </div>
      </header>
      
      <main className="receipt-container">
        <div className="receipt-paper space-y-8">
          <ReceiptUploader onUpload={handleUpload} reset={resetUploader} />
          {currentFile && (
            <ReceiptProcessor 
              file={currentFile} 
              onProcessed={handleProcessed}
              onInvalid={handleInvalidReceipt}
            />
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Processed Receipts</h2>
            <ExportButton />
          </div>
          <ReceiptsTable receipts={receipts} />
        </div>
      </main>
    </div>
  )
}
