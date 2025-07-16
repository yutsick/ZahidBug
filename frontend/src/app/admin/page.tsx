'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { User } from '@/types/user';
import { getStatusColor, getStatusText, formatDateTime } from '@/lib/utils';

const { Title } = Typography;

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      const userData = response.data.results || [];
      setUsers(userData);
      
      // Підрахунок статистики
      const newStats = {
        total: userData.length,
        new: userData.filter(u => u.status === 'new').length,
        pending: userData.filter(u => u.status === 'pending').length,
        accepted: userData.filter(u => u.status === 'accepted').length,
        declined: userData.filter(u => u.status === 'declined').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Помилка завантаження користувачів:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentUsers = users
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const columns = [
    {
      title: 'Тендер',
      dataIndex: 'tender_number',
      key: 'tender_number',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Компанія',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Підрозділ',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: 'Дата реєстрації',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Огляд системи
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Всього заявок"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Нові заявки"
              value={stats.new}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="На розгляді"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Схвалено"
              value={stats.accepted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Останні заявки" loading={loading}>
            <Table
              dataSource={recentUsers}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Швидкі дії">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={5}>
                  <WarningOutlined /> Потребують уваги
                </Title>
                <p>Нових заявок: <strong>{stats.new}</strong></p>
                <p>На розгляді: <strong>{stats.pending}</strong></p>
              </div>
              <div>
                <Title level={5}>
                  <TeamOutlined /> Статистика
                </Title>
                <p>Активних користувачів: <strong>{users.filter(u => u.is_activated).length}</strong></p>
                <p>Відхилених заявок: <strong>{stats.declined}</strong></p>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}