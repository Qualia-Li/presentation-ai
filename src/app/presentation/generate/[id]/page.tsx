// src/app/presentation/generate/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Wand2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";
import {
  type Themes,
  themes,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { Spinner } from "@/components/ui/spinner";
import { getCustomThemeById } from "@/app/_actions/presentation/theme-actions";
import { getPresentation } from "@/app/_actions/presentation/presentationActions";
import { type ImageModelList } from "@/app/_actions/image/generate";
import { ThemeBackground } from "@/components/presentation/theme/ThemeBackground";
import { ThemeSettings } from "@/components/presentation/theme/ThemeSettings";
import { Header } from "@/components/presentation/outline/Header";
import { PromptInput } from "@/components/presentation/outline/PromptInput";
import { OutlineList } from "@/components/presentation/outline/OutlineList";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Type definition for API response from /api/extract-pdf-text
interface PDFExtractResponse {
  success: boolean;
  text?: string;
  pages?: number;
  totalPages?: number;
  message?: string;
}

export default function PresentationGenerateWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const {
    setCurrentPresentation,
    setPresentationInput,
    startPresentationGeneration,
    isGeneratingPresentation,
    isGeneratingOutline,
    setOutline,
    setShouldStartOutlineGeneration,
    setTheme,
    setImageModel,
    setPresentationStyle,
    setLanguage,
    presentationInput, // <--- Added this to get the current text prompt value
  } = usePresentationState();

  // State for document upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Track if this is a fresh navigation or a revisit
  const initialLoadComplete = useRef(false);
  const generationStarted = useRef(false);

  // Use React Query to fetch presentation data
  const { data: presentationData, isLoading: isLoadingPresentation } = useQuery(
    {
      queryKey: ["presentation", id],
      queryFn: async () => {
        const result = await getPresentation(id);
        if (!result.success) {
          throw new Error(result.message ?? "Failed to load presentation");
        }
        return result.presentation;
      },
      enabled: !!id,
    }
  );

  // This effect handles the immediate startup of generation upon first mount
  useEffect(() => {
    // Only run once on initial page load
    if (initialLoadComplete.current) return;
    initialLoadComplete.current = true;

    // If isGeneratingOutline is true but generation hasn't been started yet,
    // this indicates we just came from the dashboard and should start generation
    if (isGeneratingOutline && !generationStarted.current) {
      console.log("Starting outline generation after navigation");
      generationStarted.current = true;

      // Give the component time to fully mount and establish connections
      // before starting the generation process
      setTimeout(() => {
        setShouldStartOutlineGeneration(true);
      }, 100);
    }
  }, [isGeneratingOutline, setShouldStartOutlineGeneration]);

  // Update presentation state when data is fetched
  useEffect(() => {
    if (presentationData && !isLoadingPresentation) {
      setCurrentPresentation(presentationData.id, presentationData.title);
      setPresentationInput(presentationData.title); // This will be the initial prompt text if any

      if (presentationData.presentation?.outline) {
        setOutline(presentationData.presentation.outline);
      }

      // Set theme if available
      if (presentationData?.presentation?.theme) {
        const themeId = presentationData.presentation.theme;

        // Check if this is a predefined theme
        if (themeId in themes) {
          // Use predefined theme
          setTheme(themeId as Themes);
        } else {
          // If not in predefined themes, treat as custom theme
          void getCustomThemeById(themeId)
            .then((result) => {
              if (result.success && result.theme) {
                // Set the theme with the custom theme data
                const themeData = result.theme
                  .themeData as unknown as ThemeProperties;
                setTheme(themeId, themeData);
              } else {
                // Fallback to default theme if custom theme not found
                console.warn("Custom theme not found:", themeId);
                setTheme("mystique");
              }
            })
            .catch((error) => {
              console.error("Failed to load custom theme:", error);
              // Fallback to default theme on error
              setTheme("mystique");
            });
        }
      }

      // Set imageModel if available
      if (presentationData?.presentation?.imageModel) {
        setImageModel(
          presentationData?.presentation?.imageModel as ImageModelList
        );
      }

      // Set presentationStyle if available
      if (presentationData?.presentation?.presentationStyle) {
        setPresentationStyle(presentationData.presentation.presentationStyle);
      }

      // Set language if available
      if (presentationData.presentation?.language) {
        setLanguage(presentationData.presentation.language);
      }
    }
  }, [
    presentationData,
    isLoadingPresentation,
    setCurrentPresentation,
    setPresentationInput,
    setOutline,
    setTheme,
    setImageModel,
    setPresentationStyle,
    setLanguage,
  ]);

  // Handler for file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null); // Clear previous errors
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setFileError("Only PDF files are supported.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFileError("File too large. Maximum size is 10MB.");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      console.log("Selected file:", file.name);
      // REMOVED: setPresentationInput(""); // No longer clearing text prompt here
    } else {
      setSelectedFile(null);
      // Optional: If file is unselected, restore previous text input or set to empty
      // setPresentationInput("");
    }
  };

  const handleGenerate = async () => {
    // Navigate to the presentation view first
    router.push(`/presentation/${id}`);

    // Start with the current text prompt content
    let finalInputText = presentationInput;

    if (selectedFile) {
      setIsProcessingFile(true);
      setFileError(null);
      try {
        const formData = new FormData();
        formData.append('pdfFile', selectedFile);

        const response = await fetch('/api/extract-pdf-text', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json() as PDFExtractResponse; // Type assertion

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? `Failed to extract text from PDF: ${response.statusText}`);
        }

        const extractedText = data.text;

        if (extractedText) {
          // COMBINE LOGIC:
          if (finalInputText.trim() !== "") {
            // If there's existing text input, combine it with the PDF text
            // Using a distinct separator to differentiate content sources
            finalInputText = `${finalInputText.trim()}\n\n---\n\n${extractedText.trim()}`;
          } else {
            // If no existing text input, just use the extracted text
            finalInputText = extractedText.trim();
          }

          // Optional: Show success message with page info
          if (data.pages && data.totalPages) {
            console.log(`Successfully extracted text from ${data.pages} of ${data.totalPages} pages`);
          }
        } else {
          setFileError('Could not extract text from the PDF. It might be empty or malformed.');
          setIsProcessingFile(false); // Ensure loading state is reset on error
          return; // Don't proceed with generation if PDF extraction failed
        }

      } catch (error: unknown) { // Use unknown for catch error and then narrow its type
        console.error('Error processing PDF:', error);
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        setFileError(`Failed to process document: ${errorMessage}`);
        setIsProcessingFile(false); // Ensure loading state is reset on error
        return; // Don't proceed with generation if there was an error
      }
      // Note: finally block is removed as setIsProcessingFile(false) is now in catch/else blocks
    }

    // Set the final combined text to the presentation state
    // This happens whether a PDF was processed or only text input was used
    setPresentationInput(finalInputText);
    startPresentationGeneration(); // Trigger the AI generation with the combined text
  };

  if (isLoadingPresentation) {
    return (
      <ThemeBackground>
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center">
          <div className="relative">
            <Spinner className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Loading Presentation Outline</h2>
            <p className="text-muted-foreground">Please wait a moment...</p>
          </div>
        </div>
      </ThemeBackground>
    );
  }

  // Determine if generation is happening (either presentation generation or file processing)
  const isGenerating = isGeneratingPresentation || isProcessingFile;

  return (
    <ThemeBackground>
      <Button
        variant="ghost"
        className="absolute left-4 top-4 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="mx-auto max-w-4xl space-y-8 p-8 pt-6">
        <div className="space-y-8">
          <Header />
          <PromptInput /> {/* Existing text input component */}

          {/* New: Document Upload Section */}
          <div className="!mt-8 space-y-4 rounded-lg border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold">Or Upload a Document</h2>
            <p className="text-sm text-muted-foreground">
              Upload a PDF document to generate a presentation from its content. Maximum file size: 10MB.
            </p>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="document-upload" className="sr-only">Upload Document</Label>
              <Input
                id="document-upload"
                type="file"
                accept=".pdf" // Restrict to PDF files
                onChange={handleFileChange}
                // Tailwind classes for styling a file input to look decent
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
              {selectedFile && !fileError && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {fileError && (
                <p className="text-sm text-red-500 mt-2">{fileError}</p>
              )}
            </div>
          </div>

          <OutlineList />

          <div className="!mb-32 space-y-4 rounded-lg border bg-muted/30 p-6">
            <h2 className="text-lg font-semibold">Customize Theme</h2>
            <ThemeSettings />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex justify-center border-t bg-background/80 p-4 backdrop-blur-sm">
        <Button
          size="lg"
          className="gap-2 px-8"
          onClick={handleGenerate}
          // Disable if any generation/processing is active
          disabled={isGenerating || isGeneratingOutline}
        >
          {isGenerating ? (
            <>
              <Spinner className="h-5 w-5 animate-spin mr-2" />
              {isProcessingFile ? "Processing Document..." : "Generating Presentation..."}
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              Generate Presentation
            </>
          )}
        </Button>
      </div>
    </ThemeBackground>
  );
}