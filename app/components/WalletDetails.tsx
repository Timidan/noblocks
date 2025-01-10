"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PiCaretDown } from "react-icons/pi";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import { useOutsideClick } from "../hooks";
import { classNames, fetchSupportedTokens, formatCurrency } from "../utils";
import { WalletIcon } from "./ImageAssets";
import { useBalance } from "../context/BalanceContext";
import { dropdownVariants } from "./AnimatedComponents";
import { useFundWallet, usePrivy } from "@privy-io/react-auth";
import { Token } from "../types";
import { useNetwork } from "../context/NetworksContext";
import { trackEvent } from "../hooks/analytics";
import { WithdrawalModal } from "./WithdrawalModal";

export const WalletDetails = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] =
    useState<boolean>(false);

  const { smartWalletBalance, allBalances } = useBalance();

  const { user } = usePrivy();
  const { fundWallet } = useFundWallet();
  const handleFundWallet = async (address: string) => await fundWallet(address);

  const smartWallet = user?.linkedAccounts.find(
    (account) => account.type === "smart_wallet",
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick({
    ref: dropdownRef,
    handler: () => setIsOpen(false),
  });

  const { selectedNetwork } = useNetwork();

  const tokens: { name: string; imageUrl: string | undefined }[] = [];
  const fetchedTokens: Token[] =
    fetchSupportedTokens(selectedNetwork.chain.name) || [];
  for (const token of fetchedTokens) {
    tokens.push({
      name: token.symbol,
      imageUrl: token.imageUrl,
    });
  }

  const getTokenImageUrl = (tokenName: string) => {
    const token = tokens.find((token) => token.name === tokenName);
    return token ? token.imageUrl : "";
  };

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          title="Wallet balance"
          onClick={() => {
            setIsOpen(!isOpen);
            trackEvent("cta_clicked", { cta: "Wallet Balance Dropdown" });
          }}
          className="focus-visible:ring-lavender-500 dark:bg-surface-overlay flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-2.5 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900"
        >
          <WalletIcon className="size-4" />
          <div className="h-10 w-px border-r border-dashed border-gray-100 dark:border-white/10" />
          <div className="flex items-center gap-1.5 dark:text-white/80">
            <p>
              {formatCurrency(smartWalletBalance?.total ?? 0, "USD", "en-US")}
            </p>
            <PiCaretDown
              aria-label="Caret down"
              className={classNames(
                "mx-1 size-4 text-gray-400 transition-transform duration-300 dark:text-white/50",
                isOpen ? "rotate-180" : "",
              )}
            />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={dropdownVariants}
              className="dark:bg-surface-overlay absolute right-0 mt-3 w-[273px] space-y-2 rounded-xl border border-neutral-100 bg-white p-2 shadow-lg dark:border-white/5"
            >
              {allBalances.smartWallet?.balances && (
                <div className="space-y-3 rounded-xl p-3 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-light text-gray-500 dark:text-white/50">
                      Noblocks Wallet
                    </h3>
                  </div>

                  <ul className="space-y-2 text-neutral-900 dark:text-white/80">
                    {Object.entries(
                      allBalances.smartWallet?.balances || {},
                    ).map(([token, balance]) => (
                      <li key={token} className="flex items-center gap-1">
                        <img
                          src={getTokenImageUrl(token)}
                          alt={token}
                          className="size-3.5"
                        />
                        <span className="font-medium">
                          {balance} {token}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleFundWallet(smartWallet?.address ?? "");
                        setIsOpen(false);
                      }}
                      className="text-lavender-500 font-medium"
                    >
                      Fund
                    </button>
                    <p className="text-[10px] dark:text-white/10">|</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="text-lavender-500 font-medium"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )}

              {allBalances.externalWallet?.balances && (
                <div className="space-y-3 rounded-xl p-3 dark:bg-white/5">
                  <h3 className="font-light text-gray-500 dark:text-white/50">
                    External Wallet
                  </h3>
                  <ul className="space-y-2 text-neutral-900 dark:text-white/80">
                    {Object.entries(allBalances.externalWallet.balances).map(
                      ([token, balance]) => (
                        <li key={token} className="flex items-center gap-1">
                          <img
                            src={getTokenImageUrl(token)}
                            alt={token}
                            className="size-3.5"
                          />
                          <span>
                            {balance} {token}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel
            transition
            className="dark:bg-surface-overlay relative max-h-[90vh] w-full max-w-[25.75rem] overflow-y-auto rounded-2xl bg-white p-5 text-sm shadow-xl transition-all duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <WithdrawalModal setIsWithdrawModalOpen={setIsWithdrawModalOpen} />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};
