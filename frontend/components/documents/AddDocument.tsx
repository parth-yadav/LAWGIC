'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  UploadIcon,
  FileIcon,
  LoaderIcon,
  XIcon,
  CheckIcon,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef, useCallback } from 'react'
import ApiClient from '@/utils/ApiClient'
import { toast } from 'sonner'

// Validation schema based on Document model
const documentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'Please select a file')
    .refine(
      (file) => file.type === 'application/pdf',
      'Only PDF files are allowed'
    )
    .refine(
      (file) => file.size <= 50 * 1024 * 1024, // 50MB
      'File size must be less than 50MB'
    ),
})

type DocumentFormData = z.infer<typeof documentSchema>

export default function AddDocument({ onAdd }: { onAdd?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
    },
  })

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      const file = files[0]

      if (file && file.type === 'application/pdf') {
        form.setValue('file', file)
        // Auto-fill title if empty
        if (!form.getValues('title')) {
          const fileName = file.name.replace(/\.[^/.]+$/, '')
          form.setValue('title', fileName)
        }
      }
    },
    [form]
  )

  const handleFileSelect = useCallback(
    (file: File) => {
      form.setValue('file', file)
      // Auto-fill title if empty
      if (!form.getValues('title')) {
        const fileName = file.name.replace(/\.[^/.]+$/, '')
        form.setValue('title', fileName)
      }
    },
    [form]
  )

  const removeFile = useCallback(() => {
    form.setValue('file', undefined as any)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [form])

  const onSubmit = async (data: DocumentFormData) => {
    try {
      setIsUploading(true)

      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('file', data.file)

      // Send file to backend for S3 upload
      const response = await ApiClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        toast.success('Document uploaded successfully', {
          description: `"${data.title}" has been added to your documents`,
        })
        form.reset()
        setOpen(false)
        if (onAdd) onAdd()
      } else {
        toast.error('Failed to save document', {
          description: response.data.error?.message || 'Unknown error occurred',
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Failed to upload document', {
        description: error.response?.data?.error?.message || error.message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset()
      removeFile()
    }
    setOpen(isOpen)
  }
  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <UploadIcon className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Upload Document</SheetTitle>
          <SheetDescription>
            Upload a PDF document to analyze and work with. The document will be
            securely stored and processed.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6 p-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter document title..."
                      {...field}
                      disabled={isUploading}
                    />
                  </FormControl>
                  <FormDescription>
                    A descriptive title for your document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>PDF File</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileSelect(file)
                            onChange(file) // Update react-hook-form
                          }
                        }}
                        disabled={isUploading}
                        className="sr-only"
                      />

                      {/* Custom upload area */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() =>
                          !isUploading && fileInputRef.current?.click()
                        }
                        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
                          isDragOver
                            ? 'border-primary bg-primary/5 scale-105'
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                        } ${isUploading ? 'cursor-not-allowed opacity-60' : ''} ${
                          value
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : ''
                        } `}
                      >
                        {!value ? (
                          <div className="space-y-4">
                            <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                              <UploadIcon
                                className={`text-primary h-6 w-6 ${
                                  isDragOver ? 'animate-bounce' : ''
                                }`}
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-medium">
                                {isDragOver
                                  ? 'Drop your PDF here'
                                  : 'Upload PDF Document'}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Drag and drop your file here, or click to browse
                              </p>
                              <p className="text-muted-foreground text-xs">
                                PDF files only • Max 50MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-medium text-green-700 dark:text-green-300">
                                File Selected
                              </p>
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <FileIcon className="h-4 w-4" />
                                <span className="font-medium">
                                  {value.name}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-xs">
                                {(value.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFile()
                                }}
                                disabled={isUploading}
                                className="mt-2"
                              >
                                <XIcon className="mr-1 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Upload overlay */}
                        {isUploading && (
                          <div className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm">
                            <div className="space-y-2 text-center">
                              <LoaderIcon className="text-primary mx-auto h-8 w-8 animate-spin" />
                              <p className="text-sm font-medium">
                                Uploading...
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select a PDF file (max 50MB)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading} className="flex-1">
                {isUploading ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
