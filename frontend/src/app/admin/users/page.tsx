'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Modal, 
  Input, 
  Select, 
  Card,
  Typography,
  message,
  Descriptions,
  Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { User } from '@/types/user';
import { Department } from '@/types/department';

import { getStatusColor, getStatusText, formatDateTime } from '@/lib/utils';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [declineVisible, setDeclineVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    department: '',
  });

  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      setUsers(response.data.results || []);
    } catch (error) {
      console.error('Помилка завантаження користувачів:', error);
      message.error('Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('Помилка завантаження підрозділів:', error);
    }
  };

  const handleApprove = async (userId: number) => {
    try {
      await apiClient.approveUser(userId);
      message.success('Користувача схвалено');
      loadUsers();
    } catch (error) {
      console.error('Помилка схвалення:', error);
      message.error('Помилка схвалення користувача');
    }
  };

  const handleDecline = async () => {
    if (!selectedUser) return;
    
    try {
      await apiClient.declineUser(selectedUser.id, declineReason);
      message.success('Користувача відхилено');
      setDeclineVisible(false);
      setDeclineReason('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Помилка відхилення:', error);
      message.error('Помилка відхилення користувача');
    }
  };

  const showDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsVisible(true);
  };

  const showDeclineModal = (user: User) => {
    setSelectedUser(user);
    setDeclineVisible(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !filters.search || 
      user.company_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.tender_number.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesDepartment = !filters.department || user.department.toString() === filters.department;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });
  const columns: ColumnsType<User> = [
    {
      title: 'Тендер',
      dataIndex: 'tender_number',
      key: 'tender_number',
      render: (text: string) => <strong>{text}</strong>,
      sorter: (a: User, b: User) => a.tender_number.localeCompare(b.tender_number),
    },
    {
      title: 'Компанія',
      dataIndex: 'company_name',
      key: 'company_name',
      sorter: (a: User, b: User) => a.company_name.localeCompare(b.company_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
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
      filters: [
        { text: 'Новий', value: 'new' },
        { text: 'В процесі', value: 'in_progress' },
        { text: 'Очікує рішення', value: 'pending' },
        { text: 'Підтверджений', value: 'accepted' },
        { text: 'Відхилений', value: 'declined' },
      ],
      onFilter: (value: React.Key | boolean, record: User) => record.status === value,
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
      sorter: (a: User, b: User) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Дії',
      key: 'actions',
      render: (_, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => showDetails(record)}
          >
            Переглянути
          </Button>
          {record.status === 'new' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
              style={{ color: '#52c41a' }}
            >
              Схвалити
            </Button>
          )}
          {['new', 'in_progress', 'pending'].includes(record.status) && (
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={() => showDeclineModal(record)}
              danger
            >
              Відхилити
            </Button>
          )}
        </Space>
      ),
    },
  ];
  

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Управління користувачами
      </Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="Пошук по компанії, тендеру або email"
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <Select
            placeholder="Фільтр по статусу"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
          >
            <Option value="new">Новий</Option>
            <Option value="in_progress">В процесі</Option>
            <Option value="pending">Очікує рішення</Option>
            <Option value="accepted">Підтверджений</Option>
            <Option value="declined">Відхилений</Option>
          </Select>
          <Select
            placeholder="Фільтр по підрозділу"
            allowClear
            style={{ width: 200 }}
            onChange={(value) => setFilters(prev => ({ ...prev, department: value || '' }))}
          >
            {departments.map(dept => (
              <Option key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </Option>
            ))}
          </Select>
        </Space>
        
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} з ${total} записів`,
          }}
        />
      </Card>

      {/* Модальне вікно деталей користувача */}
      <Modal
        title="Деталі користувача"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUser && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Номер тендеру">
                {selectedUser.tender_number}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={getStatusColor(selectedUser.status)}>
                  {getStatusText(selectedUser.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Компанія">
                {selectedUser.company_name}
              </Descriptions.Item>
              <Descriptions.Item label="ЄДРПОУ">
                {selectedUser.edrpou}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedUser.email}
              </Descriptions.Item>
              <Descriptions.Item label="Телефон">
                {selectedUser.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Контактна особа">
                {selectedUser.contact_person}
              </Descriptions.Item>
              <Descriptions.Item label="Директор">
                {selectedUser.director_name}
              </Descriptions.Item>
              <Descriptions.Item label="Юридична адреса">
                {selectedUser.legal_address}
              </Descriptions.Item>
              <Descriptions.Item label="Фактична адреса">
                {selectedUser.actual_address}
              </Descriptions.Item>
              <Descriptions.Item label="Підрозділ">
                {selectedUser.department_name}
              </Descriptions.Item>
              <Descriptions.Item label="Дата реєстрації">
                {formatDateTime(selectedUser.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Останнє оновлення">
                {formatDateTime(selectedUser.updated_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Останній вхід">
                {selectedUser.last_login ? formatDateTime(selectedUser.last_login) : 'Не входив'}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Space>
              {selectedUser.status === 'new' && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    handleApprove(selectedUser.id);
                    setDetailsVisible(false);
                  }}
                >
                  Схвалити
                </Button>
              )}
              {['new', 'in_progress', 'pending'].includes(selectedUser.status) && (
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setDetailsVisible(false);
                    showDeclineModal(selectedUser);
                  }}
                >
                  Відхилити
                </Button>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* Модальне вікно відхилення */}
      <Modal
        title="Відхилити користувача"
        open={declineVisible}
        onOk={handleDecline}
        onCancel={() => {
          setDeclineVisible(false);
          setDeclineReason('');
          setSelectedUser(null);
        }}
        okText="Відхилити"
        cancelText="Скасувати"
        okButtonProps={{ danger: true }}
      >
        <p>Ви впевнені, що хочете відхилити користувача <strong>{selectedUser?.company_name}</strong>?</p>
        <TextArea
          rows={4}
          placeholder="Вкажіть причину відхилення (необов'язково)"
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
}