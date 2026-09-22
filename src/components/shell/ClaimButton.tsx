"use client";
import { useTransition } from "react";
import { claimChallengeAction } from "@/lib/actions";
import { celebrate } from "@/lib/effects";
import { CheckIcon } from "@/components/icons/Icon";

export function ClaimButton({ id, claimed }: { id: number; claimed: boolean }) {
  const [pending, start] = useTransition();
  if (claimed) return <span className="inline-block text-emerald-400" title="دریافت شد"><CheckIcon className="h-5 w-5" /></span>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await claimChallengeAction(id); celebrate(); })}
      className="btn btn-primary !px-3 !py-1.5 !text-xs !rounded-xl animate-bounce-slow"
    >
      دریافت
    </button>
  );
}
