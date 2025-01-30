import { createWorker } from 'tesseract.js';

// Define basic OpenCV types
interface Mat {
  delete(): void;
}

interface OpenCV {
  imread(canvas: HTMLCanvasElement): Mat;
  imshow(canvas: HTMLCanvasElement, mat: Mat): void;
  cvtColor(src: Mat, dst: Mat, code: number): void;
  adaptiveThreshold(src: Mat, dst: Mat, maxValue: number, adaptiveMethod: number, thresholdType: number, blockSize: number, c: number): void;
  medianBlur(src: Mat, dst: Mat, ksize: number): void;
  Mat: new () => Mat;
  COLOR_RGBA2GRAY: number;
  ADAPTIVE_THRESH_GAUSSIAN_C: number;
  THRESH_BINARY: number;
  onRuntimeInitialized: () => void;
}

let cv: OpenCV | null = null;

export async function loadOpenCV() {
  if (!cv) {
    cv = (await import('@techstark/opencv-js')).default;
    await new Promise((resolve) => {
      // check if already initialized
      if (cv?.onRuntimeInitialized) {
        resolve(true);
      } else {
        // waiot for opencv to be ready
        cv!.onRuntimeInitialized = () => {
          resolve(true);
        };
      }
    });
  }
  return cv;
}

export async function preprocessImage(imageFile: File): Promise<HTMLCanvasElement> {
  const cv = await loadOpenCV();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        // converting to OpenCV format
        const src = cv.imread(canvas);
        const dst = new cv.Mat();

        // converting to grayscale
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

        // applying adaptive thresholding
        const maxValue = 255;
        const blockSize = 11;
        const c = 2;
        cv.adaptiveThreshold(
          dst,
          dst,
          maxValue,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY,
          blockSize,
          c
        );

        // denoising + redrawiung + cleanup
        cv.medianBlur(dst, dst, 3);
        cv.imshow(canvas, dst);
        src.delete();
        dst.delete();

        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
}

export async function performOCR(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('eng');
  
  try {
    await worker.load();
    const result = await worker.recognize(canvas);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

export interface ExtractedData {
  date?: string;
  vendor?: string;
  amount?: number;
  items?: Array<{
    description: string;
    price: number;
  }>;
}

export function parseReceiptText(text: string): ExtractedData {
  // preventing recursion possibility
  const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/](?:\d{2}|\d{4})\b/;
  const amountPattern = /\$?\s*\d{1,10}\.\d{2}\b/;
  
  const extracted: ExtractedData = {};
  
  // extracting date
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    extracted.date = dateMatch[0];
  }
  
  // extracting total amount (usually last dollar amount in receipt)
  const amounts = text.match(new RegExp(amountPattern, 'g'));
  if (amounts) {
    const lastAmount = amounts[amounts.length - 1];
    extracted.amount = parseFloat(lastAmount.replace('$', '').trim());
  }
  
  // extracting vendor (usually first or second line of receipt)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    extracted.vendor = lines[0].trim();
  }
  
  return extracted;
}