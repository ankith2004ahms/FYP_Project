'use client'
import { useState, useRef, useTransition, useEffect } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import ChatMessage from '@/components/chat-message'
import Image from 'next/image'
import { sendMessage, Message } from '@/app/actions'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/context/language-context'

export default function ChatInterface() {
  const { toast } = useToast()
  const { t, language } = useLanguage();

  const initialMessages = [
    {
      id: 1,
      role: 'assistant',
      content:
        'Hello! I am your personal AI plant doctor. Please upload an image of your plant, and I will do my best to diagnose any issues.',
    },
  ] as Message[];

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const content = {
    initialMessage: 'Hello! I am your personal AI plant doctor. Please upload an image of your plant, and I will do my best to diagnose any issues.',
    imageReady: 'Image ready to send',
    attachImage: 'Attach an image...',
    noImageError: 'No image selected',
    noImageDescription: 'Please select an image to send.'
  }

  const [translatedContent, setTranslatedContent] = useState(content);

  useEffect(() => {
    const translate = async () => {
      const translationResult = await t([content.initialMessage, content.imageReady, content.attachImage, content.noImageError, content.noImageDescription]);
      if (Array.isArray(translationResult)) {
        setTranslatedContent({
          initialMessage: translationResult[0],
          imageReady: translationResult[1],
          attachImage: translationResult[2],
          noImageError: translationResult[3],
          noImageDescription: translationResult[4]
        });
        setMessages([
          {
            id: 1,
            role: 'assistant',
            content: translationResult[0],
          },
        ]);
      }
    };
    translate();
  }, [language, t]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    const file = formData.get('image')
    formData.append('language', language);


    if (!file || !(file instanceof File) || file.size === 0) {
      toast({
        variant: 'destructive',
        title: translatedContent.noImageError,
        description: translatedContent.noImageDescription,
      })
      return
    }

    // Add user message with preview
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: '',
      image: imagePreview!,
      isSaving: true,
    }
    setMessages(prev => [...prev, userMessage])
    setImagePreview(null)
    formRef.current?.reset()

    startTransition(async () => {
      const newMessages = await sendMessage(messages, formData)
      setMessages(newMessages)
    })
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isPending && messages[messages.length-1]?.role === 'user' && (
             <ChatMessage 
                key={messages[messages.length-1].id} 
                message={{...messages[messages.length-1], isSaving: true}}
              />
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
          <input
            type="file"
            name="image"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {imagePreview && (
            <div className="absolute bottom-16 left-4 w-24 h-24 bg-background p-1 border rounded-md shadow-lg">
              <Image
                src={imagePreview}
                alt="Image preview"
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
          )}
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 px-2 py-1 text-sm text-muted-foreground">
              {imagePreview ? translatedContent.imageReady : translatedContent.attachImage}
            </div>

            <Button type="submit" size="icon" disabled={isPending || !imagePreview}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
