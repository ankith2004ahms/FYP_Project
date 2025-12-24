'use client'
import { Bot, Leaf, User } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Skeleton } from './ui/skeleton'
import { Message } from '@/app/actions'
import { useLanguage } from '@/context/language-context'
import { useState, useEffect } from 'react'

interface ChatMessageProps {
  message: Message
}

function AssistantContent({ content }: { content: any }) {
  const { t, language } = useLanguage();

  const staticContent = {
    predictedDisease: 'Predicted Disease',
    treatmentPlan: 'Treatment Plan',
    viewSteps: 'View Recommended Steps'
  }

  const [translatedContent, setTranslatedContent] = useState(staticContent);
  
  useEffect(() => {
    const translateStaticContent = async () => {
      if (language === 'en') {
        setTranslatedContent(staticContent);
        return;
      }
      const result = await t([staticContent.predictedDisease, staticContent.treatmentPlan, staticContent.viewSteps]);
      if(Array.isArray(result)) {
        setTranslatedContent({
          predictedDisease: result[0],
          treatmentPlan: result[1],
          viewSteps: result[2]
        });
      }
    };
    translateStaticContent();
  }, [language, t]);


  if (typeof content === 'string') {
    return <p>{content}</p>;
  }
  
  if (!content || !content.disease || !content.treatment) {
    return <p>Sorry, I could not analyze the image. Please try again.</p>;
  }
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          {translatedContent.predictedDisease}
        </h3>
        <p className="font-bold text-lg">{content.disease}</p>
      </div>
      <div>
        <h3 className="font-semibold mb-2">{translatedContent.treatmentPlan}</h3>
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>{translatedContent.viewSteps}</AccordionTrigger>
            <AccordionContent className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
              {content.treatment}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}


export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  if (message.isSaving && isUser) {
    return (
       <div className={cn('flex items-end gap-2', isUser ? 'justify-end' : 'justify-start')}>
        <div className={cn('max-w-md rounded-lg p-3', 
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {message.image && (
             <div className="relative w-48 h-48 mb-2">
                <Image
                  src={message.image}
                  alt="User upload"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
             </div>
          )}
          <Skeleton className="h-4 w-24 mt-2"/>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-lg p-3',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {message.image && (
          <div className="relative w-48 h-48 mb-2">
            <Image
              src={message.image}
              alt="User upload"
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
        )}
        {isUser && !message.content && !message.image ? <Skeleton className="w-32 h-24" /> : null}
        
        {!isUser ? <AssistantContent content={message.content} /> : null}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
