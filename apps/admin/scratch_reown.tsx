import { useAppKitAccount } from '@reown/appkit/react';
export function Test() {
  const account = useAppKitAccount();
  return <div>{account.isConnected}</div>;
}
