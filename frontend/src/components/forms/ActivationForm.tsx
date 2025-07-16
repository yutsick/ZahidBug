'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { ActivationFormData, activationSchema } from '@/lib/validations';

const { Title } = Typography;

interface ActivationFormProps {
  token: string;
}

export default function ActivationForm({ token }: ActivationFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const onFinish = async (values: ActivationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const validatedData = activationSchema.parse(values);
      const response = await apiClient.activate({
        ...validatedData,
        token
      });
      
      login(response.data.token, response.data.user);
      router.push('/cabinet');
    } catch (err: any) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat().join(', ');
          setError(errorMessages);
        } else {
          setError(errors);
        }
      } else if (err.issues) {
        setError(err.issues.map((issue: any) => issue.message).join(', '));
      } else {
        setError('Помилка активації');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2}>Активація акаунту</Title>
        <p style={{ color: '#8c8c8c' }}>Встановіть пароль для входу в систему</p>
      </div>
      
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="new_username"
          label="Логін (необов'язково)"
          help="Якщо не вказано, буде використано номер тендеру"
        >
          <Input 
            prefix={<UserOutlined />}
            placeholder="Логін для входу"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          label="Пароль"
          rules={[
            { required: true, message: 'Введіть пароль' },
            { min: 8, message: 'Пароль має містити мінімум 8 символів' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />}
            placeholder="Пароль (мінімум 8 символів)"
          />
        </Form.Item>
        
        <Form.Item
          name="password_confirm"
          label="Підтвердження паролю"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Підтвердіть пароль' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Паролі не співпадають'));
              },
            }),
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />}
            placeholder="Підтвердіть пароль"
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{ width: '100%' }}
          >
            Активувати акаунт
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}