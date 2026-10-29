import { Layout, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { PersonalMenu } from '@/modules/account/components/PersonalMenu';
import { useAccountProfile, useEnsureSession } from '@/modules/account/hooks/use-account-session';
import { HomeView } from '@/app/views/HomeView';
import { TransferView } from '@/app/views/TransferView';

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
    <Layout className="flex min-h-screen flex-col bg-transparent">
      <Header className="flex items-center justify-end gap-4 bg-transparent px-6">
        {!loading ? (
          <PersonalMenu meritPoints={meritPoints} onOpenTransfer={() => setScreen('transfer')} />
        ) : null}
      </Header>
      <Content className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-12 pt-6">
        {loading ? (
          <div className="flex justify-center p-12">
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
