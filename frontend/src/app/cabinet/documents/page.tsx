'use client';

import { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  List, 
  Tag, 
  Space, 
  Modal, 
  Alert,
  Tabs,
  Typography
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const requiredDocuments = [
  {
    id: 1,
    name: 'Статут підприємства',
    required: true,
    description: 'Засвідчена копія статуту юридичної особи',
    uploaded: false,
    file: null
  },
  {
    id: 2,
    name: 'Довідка про державну реєстрацію',
    required: true,
    description: 'Витяг з ЄДР або довідка про державну реєстрацію',
    uploaded: true,
    file: { name: 'registration.pdf', size: 1024000, date: new Date() }
  },
  {
    id: 3,
    name: 'Довідка про відсутність заборгованості',
    required: true,
    description: 'Довідка про відсутність заборгованості по податках',
    uploaded: false,
    file: null
  },
  {
    id: 4,
    name: 'Фінансова звітність',
    required: true,
    description: 'Фінансова звітність за останній рік',
    uploaded: true,
    file: { name: 'financial_report.pdf', size: 2048000, date: new Date() }
  },
  {
    id: 5,
    name: 'Довідка про досвід роботи',
    required: false,
    description: 'Довідка про досвід виконання аналогічних робіт',
    uploaded: false,
    file: null
  },
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState(requiredDocuments);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const handleUpload = (documentId: number, file: File) => {
    setUploading(true);
    
    // Імітація завантаження
    setTimeout(() => {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { 
                ...doc, 
                uploaded: true, 
                file: { 
                  name: file.name, 
                  size: file.size, 
                  date: new Date() 
                } 
              }
            : doc
        )
      );
      setUploading(false);
    }, 2000);
  };

  const handleDelete = (documentId: number) => {
    Modal.confirm({
      title: 'Видалити документ?',
      content: 'Ви впевнені, що хочете видалити цей документ?',
      onOk: () => {
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, uploaded: false, file: null }
              : doc
          )
        );
      },
    });
  };

  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const requiredCount = documents.filter(doc => doc.required).length;
  const requiredUploadedCount = documents.filter(doc => doc.required && doc.uploaded).length;

  const getStatusAlert = () => {
    if (user.status === 'in_progress') {
      return (
        <Alert
          message="Завантажте необхідні документи"
          description="Для продовження процесу завантажте всі обов'язкові документи"
          type="warning"
          showIcon
        />
      );
    }
    
    if (user.status === 'pending') {
      return (
        <Alert
          message="Документи на розгляді"
          description="Адміністратор перевіряє надані документи"
          type="info"
          showIcon
        />
      );
    }
    
    if (user.status === 'accepted') {
      return (
        <Alert
          message="Документи схвалено"
          description="Всі документи успішно перевірено та схвалено"
          type="success"
          showIcon
        />
      );
    }
    
    if (user.status === 'declined') {
      return (
        <Alert
          message="Документи відхилено"
          description="Деякі документи не пройшли перевірку. Зверніться до адміністратора"
          type="error"
          showIcon
        />
      );
    }
    
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {getStatusAlert() && (
        <div style={{ marginBottom: 24 }}>
          {getStatusAlert()}
        </div>
      )}

      <Card title="Статистика завантаження" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {uploadedCount}/{documents.length}
            </Title>
            <Text type="secondary">Всього документів</Text>
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {requiredUploadedCount}/{requiredCount}
            </Title>
            <Text type="secondary">Обов'язкових документів</Text>
          </div>
        </div>
      </Card>

      <Card title="Документи">
        <Tabs defaultActiveKey="required">
          <TabPane tab="Обов'язкові документи" key="required">
            <List
              dataSource={documents.filter(doc => doc.required)}
              renderItem={(document) => (
                <List.Item
                  actions={[
                    document.uploaded ? (
                      <Space>
                        <Button 
                          type="link" 
                          icon={<EyeOutlined />}
                          onClick={() => {
                            Modal.info({
                              title: 'Перегляд документа',
                              content: `Документ: ${document.file?.name}`,
                            });
                          }}
                        >
                          Переглянути
                        </Button>
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(document.id)}
                        >
                          Видалити
                        </Button>
                      </Space>
                    ) : (
                      <Upload
                        beforeUpload={(file) => {
                          handleUpload(document.id, file);
                          return false;
                        }}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      >
                        <Button 
                          type="primary" 
                          icon={<UploadOutlined />}
                          loading={uploading}
                        >
                          Завантажити
                        </Button>
                      </Upload>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      document.uploaded ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
                      )
                    }
                    title={
                      <Space>
                        {document.name}
                        <Tag color={document.uploaded ? 'green' : 'orange'}>
                          {document.uploaded ? 'Завантажено' : 'Потрібно завантажити'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <p>{document.description}</p>
                        {document.file && (
                          <Text type="secondary">
                            Файл: {document.file.name} ({formatFileSize(document.file.size)})
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
          
          <TabPane tab="Додаткові документи" key="optional">
            <List
              dataSource={documents.filter(doc => !doc.required)}
              renderItem={(document) => (
                <List.Item
                  actions={[
                    document.uploaded ? (
                      <Space>
                        <Button 
                          type="link" 
                          icon={<EyeOutlined />}
                          onClick={() => {
                            Modal.info({
                              title: 'Перегляд документа',
                              content: `Документ: ${document.file?.name}`,
                            });
                          }}
                        >
                          Переглянути
                        </Button>
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(document.id)}
                        >
                          Видалити
                        </Button>
                      </Space>
                    ) : (
                      <Upload
                        beforeUpload={(file) => {
                          handleUpload(document.id, file);
                          return false;
                        }}
                        showUploadList={false}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      >
                        <Button 
                          type="default" 
                          icon={<UploadOutlined />}
                          loading={uploading}
                        >
                          Завантажити
                        </Button>
                      </Upload>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileOutlined style={{ fontSize: 20 }} />}
                    title={
                      <Space>
                        {document.name}
                        <Tag color="blue">Необов'язково</Tag>
                        {document.uploaded && <Tag color="green">Завантажено</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <p>{document.description}</p>
                        {document.file && (
                          <Text type="secondary">
                            Файл: {document.file.name} ({formatFileSize(document.file.size)})
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}