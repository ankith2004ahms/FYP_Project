import { Leaf } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Plant Savior Home">
      <Leaf className="h-7 w-7 text-accent" />
      <span className="text-2xl font-bold font-headline text-foreground">
        Plant Savior
      </span>
    </Link>
  );
}
