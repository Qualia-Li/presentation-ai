// src/app/api/extract-pdf-text/route.ts
import { NextResponse } from 'next/server';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Response type
interface PDFExtractResponse {
  success: boolean;
  text?: string;
  pages?: number;
  totalPages?: number;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!pdfFile) {
      return NextResponse.json<PDFExtractResponse>({ 
        success: false, 
        message: 'No PDF file provided.' 
      }, { status: 400 });
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json<PDFExtractResponse>({ 
        success: false, 
        message: 'Invalid file type. Only PDF files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (pdfFile.size > MAX_FILE_SIZE) {
      return NextResponse.json<PDFExtractResponse>({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB.' 
      }, { status: 413 });
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse to avoid build issues
    const pdf = (await import('pdf-parse')).default;
    
    // Parse the PDF and extract text
    const pdfData = await pdf(buffer, {
      // Optional: limit pages for performance
      max: 50
    });

    const extractedText = pdfData.text.trim();

    if (!extractedText || extractedText === '') {
      return NextResponse.json<PDFExtractResponse>({ 
        success: false, 
        message: 'No text could be extracted from the PDF. The file might be image-based or corrupted.' 
      }, { status: 422 });
    }

    return NextResponse.json<PDFExtractResponse>({ 
      success: true, 
      text: extractedText,
      pages: pdfData.numpages,
      totalPages: pdfData.numpages
    });

  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to process document for text extraction.';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF') || error.message.includes('PDF')) {
        errorMessage = 'Invalid PDF file. Please ensure the file is not corrupted.';
      } else if (error.message.includes('password')) {
        errorMessage = 'Password-protected PDFs are not supported.';
      }
    }
    
    return NextResponse.json<PDFExtractResponse>({ 
      success: false, 
      message: errorMessage 
    }, { status: 500 });
  }
}