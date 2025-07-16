'use client';

import { ConfigProvider } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider 
        locale={ukUA}
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
            colorBgContainer: '#ffffff',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}