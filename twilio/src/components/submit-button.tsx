'use client';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = ButtonProps & {
    children: React.ReactNode;
};

export function SubmitButton({ children, ...props }: Props) {
    const { pending } = useFormStatus();

    return (
        <Button {...props} type="submit" disabled={pending || props.disabled}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                children
            )}
        </Button>
    );
}
