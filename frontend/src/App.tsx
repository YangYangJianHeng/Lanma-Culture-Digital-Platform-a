import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#c62828',
          borderRadius: 6
        }
      }}
    >
      <AntApp>
        <RouterProvider router={router} future={{ v7_startTransition: true } as any} />
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
