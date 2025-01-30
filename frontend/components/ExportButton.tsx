import { Button } from './ui/button';
import { Download } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export function ExportButton() {
  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/export-csv`, {
        responseType: 'blob'
      });
      
      // creating download link for csv file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipts_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="ml-auto">
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
} 