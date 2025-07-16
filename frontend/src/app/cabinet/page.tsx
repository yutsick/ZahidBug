'use client';

import { Card, Row, Col, Statistic, Timeline, Tag } from 'antd';
import { 
  FileTextOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { getStatusColor, getStatusText, formatDateTime } from '@/lib/utils';

export default function CabinetPage() {
  const { user } = useAuth();

  if (!user) return null;

  const timelineItems = [
    {
      color: 'green',
      children: (
        <div>
          <p><strong>Реєстрацію завершено</strong></p>
          <p style={{ color: '#8c8c8c' }}>{formatDateTime(user.created_at)}</p>
        </div>
      ),
    },
    {
      color: user.is_activated ? 'green' : 'blue',
      children: (
        <div>
          <p><strong>Активація акаунту</strong></p>
          <p style={{ color: '#8c8c8c' }}>
            {user.is_activated ? 'Активовано' : 'Очікує активації'}
          </p>
        </div>
      ),
    },
    {
      color: user.status === 'pending' ? 'orange' : 
             user.status === 'accepted' ? 'green' : 
             user.status === 'declined' ? 'red' : 'gray',
      children: (
        <div>
          <p><strong>Перевірка документів</strong></p>
          <p style={{ color: '#8c8c8c' }}>
            Статус: <Tag color={getStatusColor(user.status)}>
              {getStatusText(user.status)}
            </Tag>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Номер тендеру"
              value={user.tender_number}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Статус"
              value={getStatusText(user.status)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Підрозділ"
              value={user.department_name}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Активація"
              value={user.is_activated ? 'Активовано' : 'Очікує'}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Інформація про компанію">
            <div style={{ lineHeight: '1.8' }}>
              <p><strong>Назва:</strong> {user.company_name}</p>
              <p><strong>ЄДРПОУ:</strong> {user.edrpou}</p>
              <p><strong>Контактна особа:</strong> {user.contact_person}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Телефон:</strong> {user.phone}</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Хронологія процесу">
            <Timeline items={timelineItems} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}