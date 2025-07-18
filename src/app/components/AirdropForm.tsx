"use client" 
import { useState, useMemo, useEffect } from "react"
import InputField from "./ui/InputField"
import { Tabs,TabsList, TabsTrigger } from "./ui/Tabs"

import { RiAlertFill, RiInformationLine } from "react-icons/ri"
import { chainsToTSender,tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract, useReadContracts, useWaitForTransactionReceipt} from "wagmi";
import {readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal} from "@/utils";
import { formatTokenAmount } from "@/utils/formatTokenAmount/formatTokenAmount"
import { CgSpinner } from "react-icons/cg"


interface AirdropFormProps {
  isUnsafeMode: boolean, 
  onModeChange: (unsafe: boolean) => void

}


export default function AirdropForm({ isUnsafeMode, onModeChange }: AirdropFormProps) {
  const [tokenAddress, setTokenAddress] = useState("")
  const [recipients, setRecipients] = useState("")
  const [amounts, setAmounts] = useState("")
  const config = useConfig()
  const account = useAccount()
  const chainId = useChainId()
  const { data: tokenData } = useReadContracts({
      contracts: [
          {
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "decimals",
          },
          {
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "name",
          },
          {
              abi: erc20Abi,
              address: tokenAddress as `0x${string}`,
              functionName: "balanceOf",
              args: [account.address],
          },
      ],
  })
  const [hasEnoughTokens, setHasEnoughTokens] = useState(true)

  const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({
      confirmations: 1,
      hash,
  })

  const total: number = useMemo(() => calculateTotal(amounts), [amounts])


  async function handleSubmit() {
    try {
      // Validate inputs
      if (!tokenAddress) {
        alert("Please enter a valid token address");
        return;
      }

      if (!recipients.trim()) {
        alert("Please enter at least one recipient address");
        return;
      }

      if (!amounts.trim()) {
        alert("Please enter at least one amount");
        return;
      }

      if (!total) {
        alert("Please enter valid amounts");
        return;
      }

      const tSenderAddress = chainsToTSender[chainId]["tsender"];
      if (!tSenderAddress) {
        alert("This chain is not supported");
        return;
      }

      // Validate token address by checking if it's a valid ERC20 contract
      try {
        const nameResponse = await readContract(config, {
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "name"
        });

        if (!nameResponse) {
          alert("Invalid ERC20 token address. Please enter a valid ERC20 token contract address.");
          return;
        }
      } catch (error) {
        alert("Invalid ERC20 token address. Please enter a valid ERC20 token contract address.");
        return;
      }

      // Check allowance
      const approvedAmount = await getApprovedAmount(tSenderAddress);

      if (approvedAmount < total) {
        // Approve tokens
        const approvalHash = await writeContractAsync({
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "approve",
          args: [tSenderAddress as `0x${string}`, BigInt(total)],
        });

        const approvalReceipt = await waitForTransactionReceipt(config, {
          hash: approvalHash,
        });

        console.log("Approval confirmed ", approvalReceipt);

        // Send airdrop after approval
        await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [
            tokenAddress,
            recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
            amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== ''),
            BigInt(total),
          ],
        });
      } else {
        // Send airdrop directly if already approved
        await writeContractAsync({
          abi: tsenderAbi,
          address: tSenderAddress as `0x${string}`,
          functionName: "airdropERC20",
          args: [
            tokenAddress,
            recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
            amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== ''),
            BigInt(total),
          ],
        });
      }
    } catch (error) {
      console.error("Transaction error:", error);
      alert("Transaction failed. Please check:\n1. Your inputs are correct\n2. You have sufficient balance\n3. The token address is valid\n4. You are connected to the correct network");
    }
  }

  async function getApprovedAmount(tSenderAddress: string | null): Promise<number> {
    if (!tSenderAddress) {
      alert("No address found, please use a supported chain");
      return 0;
    }

    if (!tokenAddress) {
      alert("Please enter a valid token address");
      return 0;
    }

    try {
      // First check if it's a valid ERC20 contract by trying to read the name
      const nameResponse = await readContract(config, {
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "name"
      });

      if (!nameResponse) {
        alert("Invalid ERC20 token address. Please enter a valid ERC20 token contract address.");
        return 0;
      }

      // Now check the allowance
      const response = await readContract(config, {
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "allowance",
        args: [account.address, tSenderAddress as `0x${string}`]
      });

      if (response === undefined || response === null) {
        alert("Failed to read token allowance. Please ensure you have sufficient balance and the token address is correct.");
        return 0;
      }

      return response as number;
    } catch (error) {
      console.error("Contract interaction error:", error);
      alert("Failed to interact with the token contract. Please ensure:\n1. You are connected to the correct network\n2. The token address is correct\n3. You have sufficient balance");
      return 0;
    }
  }

  function getButtonContent() {
      if (isPending)
          return (
              <div className="flex items-center justify-center gap-2 w-full">
                  <CgSpinner className="animate-spin" size={20} />
                  <span>Confirming in wallet...</span>
              </div>
          )
      if (isConfirming)
          return (
              <div className="flex items-center justify-center gap-2 w-full">
                  <CgSpinner className="animate-spin" size={20} />
                  <span>Waiting for transaction to be included...</span>
              </div>
          )
      if (error || isError) {
          console.log(error)
          return (
              <div className="flex items-center justify-center gap-2 w-full">
                  <span>Error, see console.</span>
              </div>
          )
      }
      if (isConfirmed) {
          return "Transaction confirmed."
      }
      return isUnsafeMode ? "Send Tokens (Unsafe)" : "Send Tokens"
  }

  useEffect(() => {
      const savedTokenAddress = localStorage.getItem('tokenAddress')
      const savedRecipients = localStorage.getItem('recipients')
      const savedAmounts = localStorage.getItem('amounts')

      if (savedTokenAddress) setTokenAddress(savedTokenAddress)
      if (savedRecipients) setRecipients(savedRecipients)
      if (savedAmounts) setAmounts(savedAmounts)
  }, [])

  useEffect(() => {
      localStorage.setItem('tokenAddress', tokenAddress)
  }, [tokenAddress])

  useEffect(() => {
      localStorage.setItem('recipients', recipients)
  }, [recipients])

  useEffect(() => {
      localStorage.setItem('amounts', amounts)
  }, [amounts])

  useEffect(() => {
      if (tokenAddress && total > 0 && tokenData?.[2]?.result as number !== undefined) {
          const userBalance = tokenData?.[2].result as number;
          setHasEnoughTokens(userBalance >= total);
      } else {
          setHasEnoughTokens(true);
      }
  }, [tokenAddress, total, tokenData]);

  return (
      <div
          className={`max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2 ${isUnsafeMode ? " border-red-500 ring-red-500/25" : " border-blue-500 ring-blue-500/25"}`}
      >
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">T-Sender</h2>
              <Tabs defaultValue={"false"}>
                  <TabsList>
                      <TabsTrigger value={"false"} onClick={() => onModeChange(false)}>
                          Safe Mode
                      </TabsTrigger>
                      <TabsTrigger value={"true"} onClick={() => onModeChange(true)}>
                          Unsafe Mode
                      </TabsTrigger>
                  </TabsList>
              </Tabs>
          </div>

          <div className="space-y-6">
              <InputField
                  label="Token Address"
                  placeholder="0x"
                  value={tokenAddress}
                  onChange={e => setTokenAddress(e.target.value)}
              />
              <InputField
                  label="Recipients (comma or new line separated)"
                  placeholder="0x123..., 0x456..."
                  value={recipients}
                  onChange={e => setRecipients(e.target.value)}
                  large={true}
              />
              <InputField
                  label="Amounts (wei; comma or new line separated)"
                  placeholder="100, 200, 300..."
                  value={amounts}
                  onChange={e => setAmounts(e.target.value)}
                  large={true}
              />

              <div className="bg-white border border-zinc-300 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-zinc-900 mb-3">Transaction Details</h3>
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600">Token Name:</span>
                          <span className="font-mono text-zinc-900">
                              {tokenData?.[1]?.result as string}
                          </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600">Amount (wei):</span>
                          <span className="font-mono text-zinc-900">{total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600">Amount (tokens):</span>
                          <span className="font-mono text-zinc-900">
                              {formatTokenAmount(total, tokenData?.[0]?.result as number)}
                          </span>
                      </div>
                  </div>
              </div>

              {isUnsafeMode && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <RiAlertFill size={20} />
                          <span>
                              Using{" "}
                              <span className="font-medium underline underline-offset-2 decoration-2 decoration-red-300">
                                  unsafe
                              </span>{" "}
                              super gas optimized mode
                          </span>
                      </div>
                      <div className="relative group">
                          <RiInformationLine className="cursor-help w-5 h-5 opacity-45" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64">
                              This mode skips certain safety checks to optimize for gas. Do not
                              use this mode unless you know how to verify the calldata of your
                              transaction.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 border-8 border-transparent border-t-zinc-900"></div>
                          </div>
                      </div>
                  </div>
              )}

              <button
                  className={`cursor-pointer flex items-center justify-center w-full py-3 rounded-[9px] text-white transition-colors font-semibold relative border ${isUnsafeMode
                      ? "bg-red-500 hover:bg-red-600 border-red-500"
                      : "bg-blue-500 hover:bg-blue-600 border-blue-500"
                      } ${!hasEnoughTokens && tokenAddress ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handleSubmit}
                  disabled={isPending || (!hasEnoughTokens && tokenAddress !== "")}
              >
                  {/* Gradient */}
                  <div className="absolute w-full inset-0 bg-gradient-to-b from-white/25 via-80% to-transparent mix-blend-overlay z-10 rounded-lg" />
                  {/* Inner shadow */}
                  <div className="absolute w-full inset-0 mix-blend-overlay z-10 inner-shadow rounded-lg" />
                  {/* White inner border */}
                  <div className="absolute w-full inset-0 mix-blend-overlay z-10 border-[1.5px] border-white/20 rounded-lg" />
                  {isPending || error || isConfirming
                      ? getButtonContent()
                      : !hasEnoughTokens && tokenAddress
                          ? "Insufficient token balance"
                          : isUnsafeMode
                              ? "Send Tokens (Unsafe)"
                              : "Send Tokens"}
              </button>
          </div>
      </div>
  )
}