import { WalletConnectAdapter } from "@tronweb3/tronwallet-adapter-walletconnect";

const TRUST_WALLET_ID =
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0";

export interface TronWallet {
  address: string;
  balance: string;
  network: string;
}

export class TronWalletConnector {
  private walletConnect: WalletConnectAdapter | null = null;

  private getWalletConnect(): WalletConnectAdapter {
    if (!this.walletConnect) {
      this.walletConnect = new WalletConnectAdapter({
        network: "Mainnet",
        options: {
          projectId: "0ce8aee287b84db4976604d12ad15af9",
          relayUrl: "wss://relay.walletconnect.com",
          metadata: {
            name: "TRON DApp",
            description: "TRON WalletConnect",
            url: typeof window !== "undefined" ? window.location.origin : "",
            icons: ["https://walletconnect.com/walletconnect-logo.png"],
          },
        },
        // ✅ Same qrModalOptions here
        qrModalOptions: {
          themeMode: "dark",
          explorerRecommendedWalletIds: [TRUST_WALLET_ID],
        },
      });
    }
    return this.walletConnect;
  }

  async connectTronLink(): Promise<TronWallet> {
    const tronLink = (window as any).tronLink;
    if (!tronLink) throw new Error("TronLink not installed");

    await tronLink.request?.({ method: "tron_requestAccounts" });
    const address = await this.waitForAddress();
    if (!address) throw new Error("Unlock TronLink and select account");

    return {
      address,
      balance: await this.getBalance(address),
      network: "TRON MAINNET",
    };
  }

  async connectWalletConnect(): Promise<TronWallet> {
    const wc = this.getWalletConnect();
    await wc.connect();

    const address = wc.address;
    if (!address) throw new Error("WalletConnect connection failed");

    return {
      address,
      balance: await this.getBalance(address).catch(() => "0"),
      network: "TRON MAINNET",
    };
  }

  private waitForAddress(timeout = 8000): Promise<string | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const address = (window as any).tronWeb?.defaultAddress?.base58;
        if (address) { clearInterval(interval); resolve(address); }
        if (Date.now() - start > timeout) { clearInterval(interval); resolve(null); }
      }, 200);
    });
  }

  private async getBalance(address: string): Promise<string> {
    try {
      const sun = await (window as any).tronWeb.trx.getBalance(address);
      return (sun / 1_000_000).toFixed(2);
    } catch {
      return "0";
    }
  }
}

export default new TronWalletConnector();