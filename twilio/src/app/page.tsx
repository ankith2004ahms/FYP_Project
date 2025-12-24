'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/chat-interface';
import { useLanguage } from '@/context/language-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from '@/lib/languages';

export default function Home() {
  const { toast } = useToast();
  const { t, setLanguage, language } = useLanguage();
  const resultCardRef = useRef<HTMLDivElement>(null);

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  const content = {
    title: "Your Plant's Personal AI Doctor",
    subtitle: "Send a photo of your sick plant, and our AI will diagnose the issue and provide a treatment plan.",
    footer: "Built with AI. For educational purposes only. Always consult a professional for serious plant health issues."
  }

  const [translatedContent, setTranslatedContent] = useState(content);

  useEffect(() => {
    const translate = async () => {
      const translationResult = await t([content.title, content.subtitle, content.footer]);
      if (Array.isArray(translationResult)) {
        setTranslatedContent({
          title: translationResult[0],
          subtitle: translationResult[1],
          footer: translationResult[2],
        });
      }
    };
    translate();
  }, [language, t]);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Select onValueChange={setLanguage} defaultValue={language}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 md:py-32">
          {heroImage && (
             <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          <div className="container relative text-center">
            <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl md:text-6xl">
              {translatedContent.title}
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              {translatedContent.subtitle}
            </p>
          </div>
        </section>

        <section id="analyzer" className="container py-12 md:py-24">
          <div className="mx-auto max-w-4xl grid gap-8 md:gap-12">
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <ChatInterface />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container flex flex-col items-center justify-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Logo />
            <p className="text-center text-sm leading-loose md:text-left text-muted-foreground">
              {translatedContent.footer}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
