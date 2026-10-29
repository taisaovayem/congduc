import { Layout, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { PersonalMenu } from '@/modules/account/components/PersonalMenu';
import { useAccountProfile, useEnsureSession } from '@/modules/account/hooks/use-account-session';
import { HomeView } from '@/app/views/HomeView';
import { TransferView } from '@/app/views/TransferView';
import styles from './App.module.scss';

const { Header, Content } = Layout;

type AppScreen = 'home' | 'transfer';

export function App() {
  const ensureSession = useEnsureSession();
  const [sessionReady, setSessionReady] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('home');
  const { data: account, isLoading } = useAccountProfile(sessionReady);

  useEffect(() => {
    ensureSession.mutate(undefined, {
      onSuccess: () => setSessionReady(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meritPoints = account?.meritPoints ?? '0';
  const loading = ensureSession.isPending || isLoading;

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <Typography.Title level={3} className={styles.title}>
          Công Đức
        </Typography.Title>
        {!loading ? (
          <PersonalMenu meritPoints={meritPoints} onOpenTransfer={() => setScreen('transfer')} />
        ) : null}
      </Header>
      <Content className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="large" tip="Đang khởi tạo tài khoản thiết bị…" />
          </div>
        ) : screen === 'home' ? (
          <HomeView sessionReady={sessionReady} />
        ) : (
          <TransferView meritPoints={meritPoints} onBack={() => setScreen('home')} />
        )}
      </Content>
    </Layout>
  );
}
