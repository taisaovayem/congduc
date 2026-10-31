import { Layout, Spin } from 'antd';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FeaturesMenu } from '@/modules/account/components/FeaturesMenu';
import { PersonalMenu } from '@/modules/account/components/PersonalMenu';
import { useAccountProfile, useEnsureSession } from '@/modules/account/hooks/use-account-session';

const { Header, Content } = Layout;

export function AppShell() {
  const ensureSession = useEnsureSession();
  const [sessionReady, setSessionReady] = useState(false);
  const { data: account, isLoading } = useAccountProfile(sessionReady);
  const location = useLocation();

  useEffect(() => {
    ensureSession.mutate(undefined, {
      onSuccess: () => setSessionReady(true),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meritPoints = account?.meritPoints ?? '0';
  const loading = ensureSession.isPending || isLoading;
  const isHome = location.pathname === '/';
  const isScrollablePage = !isHome;

  return (
    <Layout className="flex h-full min-h-0 flex-col bg-transparent md:min-h-screen">
      <Header className="!h-auto flex items-center justify-end gap-3 bg-transparent px-6 py-3 max-md:!px-3 max-md:py-2">
        {!loading ? (
          <div className="flex w-10 flex-col items-center gap-1">
            <PersonalMenu nickname={account?.nickname ?? ''} meritPoints={meritPoints} />
            <FeaturesMenu />
          </div>
        ) : null}
      </Header>
      <Content
        className={clsx(
          'mx-auto flex w-full min-h-0 flex-1 flex-col px-4 pb-12 pt-6',
          location.pathname.startsWith('/song-tu/phong') ? 'max-w-[900px]' : 'max-w-[720px]',
          'max-md:pb-3 max-md:pt-2',
          isScrollablePage ? 'max-md:overflow-y-auto max-md:min-h-0' : 'max-md:overflow-visible',
        )}
      >
        {loading ? (
          <div className="flex justify-center p-12">
            <Spin size="large" tip="Đang khởi tạo tài khoản thiết bị…" />
          </div>
        ) : (
          <Outlet context={{ sessionReady, meritPoints, account }} />
        )}
      </Content>
    </Layout>
  );
}

export interface AppShellContext {
  sessionReady: boolean;
  meritPoints: string;
  account?: { nickname: string; meritPoints: string; id: string };
}
