import { useState, useCallback } from 'react';
import { TOAST_DURATION } from '@/lib/constants';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToast = useCallback((message: string, duration: number = TOAST_DURATION) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast({ message: '', visible: false });
  }, []);

  return { toast, showToast, hideToast };
}
