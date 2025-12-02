'use client';

import { Toaster, toast } from 'sonner';

/**
 * Toast notifications provider.
 * Add this to your root layout to enable toast notifications.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid rgb(233, 213, 255)',
          borderRadius: '1rem',
          padding: '1rem',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)',
        },
        className: 'font-sans',
      }}
      richColors
      closeButton
      expand={false}
    />
  );
}

/**
 * Toast notification helper functions.
 * Use these to show consistent toast messages.
 */
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

export { toast };
