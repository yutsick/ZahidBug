'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
  MenuOutlined,
  MenuFoldOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Помилка при виході:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Профіль
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Налаштування
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Вихід
      </Menu.Item>
    </Menu>
  );

  const getMenuItems = () => {
    if (!user) return [];

    const commonItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Головна',
        onClick: () => router.push(user.role === 'user' ? '/cabinet' : '/admin')
      }
    ];

    if (user.role === 'user') {
      return [
        ...commonItems,
        {
          key: 'documents',
          icon: <FileTextOutlined />,
          label: 'Документи',
          onClick: () => router.push('/cabinet/documents')
        },
        {
          key: 'status',
          icon: <UserOutlined />,
          label: 'Статус заявки',
          onClick: () => router.push('/cabinet/status')
        }
      ];
    } else {
      return [
        ...commonItems,
        {
          key: 'users',
          icon: <TeamOutlined />,
          label: 'Користувачі',
          onClick: () => router.push('/admin/users')
        },
        {
          key: 'reports',
          icon: <FileTextOutlined />,
          label: 'Звіти',
          onClick: () => router.push('/admin/reports')
        }
      ];
    }
  };

  const getSelectedKey = () => {
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/status')) return 'status';
    if (pathname.includes('/users')) return 'users';
    if (pathname.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  const getPageTitle = () => {
    if (!user) return 'Тендерна система';
    
    if (pathname.includes('/documents')) return 'Документи';
    if (pathname.includes('/status')) return 'Статус заявки';
    if (pathname.includes('/users')) return 'Користувачі';
    if (pathname.includes('/reports')) return 'Звіти';
    
    return user.role === 'user' ? 'Особистий кабінет' : 'Панель адміністратора';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'ТС' : 'Тендерна система'}
          </Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={getMenuItems()}
          style={{ border: 'none' }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            <span>Вітаємо, {user?.company_name || user?.email}</span>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Avatar 
                size="large" 
                icon={<UserOutlined />} 
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px',
          padding: '24px',
          background: '#fff',
          borderRadius: '8px',
          minHeight: 280
        }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>
              {getPageTitle()}
            </Title>
          </div>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}