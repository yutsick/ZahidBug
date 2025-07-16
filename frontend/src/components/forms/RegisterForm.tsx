'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Select, Steps } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Department } from '@/types/department';
import { RegistrationFormData, registrationSchema } from '@/lib/validations';

const { Title } = Typography;
const { Option } = Select;
const { Step } = Steps;

export default function RegisterForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data);
    } catch (err) {
      console.error('Помилка завантаження підрозділів:', err);
    }
  };

  const onFinish = async (values: RegistrationFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const validatedData = registrationSchema.parse(values);
      await apiClient.register({
        ...validatedData,
        actual_address: validatedData.actual_address ?? ''
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(errors);
        }
      } else if (err.issues) {
        setError(err.issues.map((issue: any) => issue.message).join(', '));
      } else {
        setError('Помилка реєстрації');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (success) {
    return (
      <Card style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
        <Title level={2} style={{ color: '#52c41a' }}>
          Заявка подана успішно!
        </Title>
        <p style={{ fontSize: '16px', marginBottom: 24 }}>
          Очікуйте повідомлення від адміністратора на вказаний email.
        </p>
        <Button type="primary" onClick={() => router.push('/login')}>
          Перейти до входу
        </Button>
      </Card>
    );
  }

  const steps = [
    {
      title: 'Тендер',
      content: (
        <>
          <Form.Item
            name="tender_number"
            label="Номер тендеру"
            rules={[{ required: true, message: 'Введіть номер тендеру' }]}
          >
            <Input placeholder="Номер тендеру" />
          </Form.Item>
          
          <Form.Item
            name="department"
            label="Підрозділ"
            rules={[{ required: true, message: 'Виберіть підрозділ' }]}
          >
            <Select placeholder="Виберіть підрозділ">
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </>
      )
    },
    {
      title: 'Компанія',
      content: (
        <>
          <Form.Item
            name="company_name"
            label="Назва компанії"
            rules={[{ required: true, message: 'Введіть назву компанії' }]}
          >
            <Input placeholder="Назва компанії" />
          </Form.Item>
          
          <Form.Item
            name="edrpou"
            label="ЄДРПОУ"
            rules={[
              { required: true, message: 'Введіть ЄДРПОУ' },
              { pattern: /^\d{8,10}$/, message: 'ЄДРПОУ має містити 8-10 цифр' }
            ]}
          >
            <Input placeholder="ЄДРПОУ" />
          </Form.Item>
          
          <Form.Item
            name="legal_address"
            label="Юридична адреса"
            rules={[{ required: true, message: 'Введіть юридичну адресу' }]}
          >
            <Input.TextArea rows={3} placeholder="Юридична адреса" />
          </Form.Item>
          
          <Form.Item
            name="actual_address"
            label="Фактична адреса"
          >
            <Input.TextArea rows={3} placeholder="Фактична адреса" />
          </Form.Item>
          
          <Form.Item
            name="director_name"
            label="ПІБ директора"
            rules={[{ required: true, message: 'Введіть ПІБ директора' }]}
          >
            <Input placeholder="ПІБ директора" />
          </Form.Item>
        </>
      )
    },
    {
      title: 'Контакти',
      content: (
        <>
          <Form.Item
            name="contact_person"
            label="Контактна особа"
            rules={[{ required: true, message: 'Введіть контактну особу' }]}
          >
            <Input placeholder="ПІБ контактної особи" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введіть email' },
              { type: 'email', message: 'Некоректний email' }
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Телефон"
            rules={[{ required: true, message: 'Введіть телефон' }]}
          >
            <Input placeholder="Телефон" />
          </Form.Item>
        </>
      )
    }
  ];

  return (
    <Card style={{ width: '100%', maxWidth: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={2}>Реєстрація переможця тендеру</Title>
      </div>
      
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} />
        ))}
      </Steps>
      
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
        {steps[currentStep].content}
        
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {currentStep > 0 && (
            <Button 
              style={{ marginRight: 8 }} 
              onClick={prevStep}
            >
              Назад
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={nextStep}>
              Далі
            </Button>
          ) : (
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              Зареєструватися
            </Button>
          )}
        </div>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link href="/login" style={{ color: '#1890ff' }}>
          Вже маєте акаунт? Увійти
        </Link>
      </div>
    </Card>
  );
}