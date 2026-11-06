import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { Label } from '@/src/components/ui/label';

interface FormFieldProps {
  label: React.ReactNode;
  /** Id given to the control. Wires label, hint and error to it automatically. */
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Exactly one control: Input, Textarea, NativeSelect, etc. */
  children: React.ReactElement;
}

/**
 * The one way to render a labelled form control.
 * Label above, control, then either the error (red) or the hint (muted) below.
 */
export function FormField({ label, htmlFor, hint, error, required, className, children }: FormFieldProps) {
  const messageId = `${htmlFor}-message`;
  const hasMessage = Boolean(error || hint);

  const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    id: htmlFor,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': hasMessage ? messageId : undefined,
    'aria-required': required || undefined,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {control}
      {error ? (
        <p id={messageId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Responsive form layout: 1 column on phones, 2 on md+. Add md:col-span-2 for full-width fields. */
export function FormGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('grid gap-4 md:grid-cols-2 md:gap-5', className)}>{children}</div>;
}
