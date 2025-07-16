import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Введіть email або логін'),
  password: z.string().min(1, 'Введіть пароль'),
});

export const registrationSchema = z.object({
  tender_number: z.string().min(1, 'Введіть номер тендеру'),
  department: z.number().min(1, 'Виберіть підрозділ'),
  company_name: z.string().min(1, 'Введіть назву компанії'),
  edrpou: z.string()
    .min(8, 'ЄДРПОУ має містити мінімум 8 цифр')
    .max(10, 'ЄДРПОУ має містити максимум 10 цифр')
    .regex(/^\d+$/, 'ЄДРПОУ має містити лише цифри'),
  legal_address: z.string().min(1, 'Введіть юридичну адресу'),
  actual_address: z.string().optional(),
  director_name: z.string().min(1, 'Введіть ПІБ директора'),
  contact_person: z.string().min(1, 'Введіть контактну особу'),
  email: z.string().email('Некоректний email'),
  phone: z.string().min(1, 'Введіть телефон'),
});

export const activationSchema = z.object({
  password: z.string()
    .min(8, 'Пароль має містити мінімум 8 символів')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Пароль має містити великі та малі літери та цифри'),
  password_confirm: z.string(),
  new_username: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Паролі не співпадають',
  path: ['password_confirm'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type ActivationFormData = z.infer<typeof activationSchema>;