import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const colors = {
    new: 'blue',
    in_progress: 'orange',
    pending: 'gold',
    accepted: 'green',
    declined: 'red',
    blocked: 'red',
  };
  return colors[status as keyof typeof colors] || 'default';
}

export function getStatusText(status: string): string {
  const texts = {
    new: 'Новий',
    in_progress: 'В процесі',
    pending: 'Очікує рішення',
    accepted: 'Підтверджений',
    declined: 'Відхилений',
    blocked: 'Заблокований',
  };
  return texts[status as keyof typeof texts] || status;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}