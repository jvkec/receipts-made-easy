import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface UploadResponse {
  data: {
    id: number;
    date: string;
    items: Array<{
      description: string;
      price: number;
      category: string;
    }>;
    text: string;
    timestamp: string;
    vendor: string;
    amount: number;
    tax: number;
    total: number;
  };
}

interface Props {
  file: File;
  onProcessed: (response: UploadResponse) => void;
  onInvalid: () => void;
}

export function ReceiptProcessor({ file, onProcessed, onInvalid }: Props) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processReceipt = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<UploadResponse['data']>(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Classify each item
      const classifiedItems = await Promise.all(
        response.data.items.map(async (item) => {
          try {
            const classifyResponse = await axios.post(`${API_URL}/classify-item`, {
              description: item.description
            });
            return {
              ...item,
              category: classifyResponse.data.category
            };
          } catch (error) {
            console.error('Error classifying item:', error);
            return {
              ...item,
              category: 'OTHER'
            };
          }
        })
      );

      onProcessed({
        data: {
          ...response.data,
          items: classifiedItems
        }
      });
    } catch (error) {
      console.error('Error processing receipt:', error);
      setError('Error processing receipt');
      onInvalid();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-4">
      {error && (
        <div className="flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      <Button 
        onClick={processReceipt} 
        disabled={processing}
        className="w-full"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Process Receipt'
        )}
      </Button>
    </Card>
  );
} 