"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPasswordAction, loginAction, registerAction, resetPasswordAction, type ActionState } from "@/lib/actions";
import { StethoscopeIcon, MailIcon, LockIcon, UserIcon, EyeIcon, CheckCircleIcon, ErrorCircleIcon } from "@/components/icons/Icon";

/**
 * Decorative background for the auth screens: a deep medical-dark canvas with
 * two soft teal glows and a slow, animated ECG heartbeat line. All inline SVG,
 * no external assets.
 */
function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#14b8a6]/15 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[#06b6d4]/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <svg
        className="absolute bottom-10 inset-x-0 h-24 w-full opacity-30"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="ecg-line"
          d="M0 60 H 180 L 200 60 L 210 28 L 224 88 L 236 60 H 320 L 330 60 L 340 40 L 352 60 H 470 L 480 60 L 490 18 L 504 96 L 516 60 H 600 L 610 60 L 620 44 L 632 60 H 750 L 760 60 L 770 24 L 784 92 L 796 60 H 880 L 890 60 L 900 36 L 912 60 H 1030 L 1040 60 L 1050 30 L 1064 86 L 1076 60 H 1200"
          stroke="#2dd4bf"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[var(--bg)] grid place-items-center p-4">
      <AuthBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md rounded-3xl border-2 border-[var(--border)] bg-[var(--card)] p-8 shadow-2xl shadow-black/40"
      >
        <Link href="/" className="flex items-center justify-center mb-6">
          <motion.span
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#06b6d4] text-white shadow-lg shadow-[#14b8a6]/30"
          >
            <StethoscopeIcon className="h-8 w-8" />
          </motion.span>
        </Link>
        <h1 className="text-center text-2xl font-black">{title}</h1>
        {subtitle ? <p className="text-center text-sm text-muted mt-1 mb-6">{subtitle}</p> : <div className="mb-6" />}
        {children}
      </motion.div>
    </main>
  );
}

/** Text input with a leading SVG icon, replacing bare placeholder-only inputs. */
function FieldInput({ icon, type = "text", trailing, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted">{icon}</span>
      <input
        type={type}
        {...rest}
        className="w-full rounded-2xl border-2 border-soft bg-soft py-3 pr-11 pl-11 font-bold text-[var(--text)] outline-none transition-colors focus:border-[#2dd4bf]"
      />
      {trailing && <span className="absolute inset-y-0 left-4 flex items-center">{trailing}</span>}
    </div>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <FieldInput
      icon={<LockIcon className="h-5 w-5" />}
      type={show ? "text" : "password"}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-muted hover:text-[#2dd4bf]" tabIndex={-1} aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}>
          <EyeIcon open={show} className="h-5 w-5" />
        </button>
      }
      {...props}
    />
  );
}

function Msg({ state }: { state: ActionState }) {
  return (
    <AnimatePresence>
      {(state?.error || state?.success) && (
        <motion.p
          key={state?.error ?? state?.success}
          initial={{ opacity: 0, y: -6 }}
          animate={state?.error ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] } : { opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ x: { duration: 0.4 } }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${state?.error ? "bg-red-950/40 text-red-300" : "bg-emerald-950/40 text-emerald-300"}`}
        >
          {state?.error ? <ErrorCircleIcon className="h-4 w-4 shrink-0" /> : <CheckCircleIcon className="h-4 w-4 shrink-0" />}
          <span>{state?.error ?? state?.success}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <Shell title="ورود">
      <form action={action} className="flex flex-col gap-3">
        <FieldInput icon={<MailIcon className="h-5 w-5" />} name="email" type="email" required placeholder="ایمیل" dir="ltr" />
        <PasswordInput name="password" required placeholder="رمز عبور" dir="ltr" />
        <Msg state={state} />
        <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn btn-brand mt-2">{pending ? "در حال ورود..." : "ورود"}</motion.button>
      </form>
      <div className="mt-4 flex justify-between text-sm font-bold">
        <Link href="/forgot-password" className="text-[#2dd4bf] transition hover:brightness-110">رمز عبور را فراموش کردم</Link>
        <Link href="/register" className="text-[#2dd4bf] transition hover:brightness-110">ثبت‌نام</Link>
      </div>
    </Shell>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  return (
    <Shell title="ساخت حساب">
      <form action={action} className="flex flex-col gap-3">
        <FieldInput icon={<UserIcon className="h-5 w-5" />} name="name" required placeholder="نام و نام خانوادگی" />
        <FieldInput icon={<MailIcon className="h-5 w-5" />} name="email" type="email" required placeholder="ایمیل" dir="ltr" />
        <PasswordInput name="password" required minLength={6} placeholder="رمز عبور (حداقل ۶ کاراکتر)" dir="ltr" />
        <Msg state={state} />
        <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn btn-primary mt-2">{pending ? "در حال ساخت..." : "ثبت‌نام"}</motion.button>
      </form>
      <p className="mt-4 text-center text-sm font-bold">
        قبلاً حساب داری؟ <Link href="/login" className="text-[#2dd4bf] transition hover:brightness-110">ورود</Link>
      </p>
    </Shell>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  return (
    <Shell title="بازیابی رمز عبور" subtitle="ایمیل خود را وارد کنید">
      <form action={action} className="flex flex-col gap-3">
        <FieldInput icon={<MailIcon className="h-5 w-5" />} name="email" type="email" required placeholder="ایمیل" dir="ltr" />
        <Msg state={state} />
        {state?.token && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <Link href={`/reset-password?token=${state.token}`} className="btn btn-secondary text-sm">باز کردن لینک بازیابی</Link>
          </motion.div>
        )}
        <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn btn-brand mt-2">{pending ? "..." : "ارسال لینک"}</motion.button>
      </form>
      <p className="mt-4 text-center text-sm font-bold"><Link href="/login" className="text-[#2dd4bf] transition hover:brightness-110">بازگشت به ورود</Link></p>
    </Shell>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  return (
    <Shell title="رمز عبور جدید">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="token" value={token} />
        <PasswordInput name="password" required minLength={6} placeholder="رمز عبور جدید" dir="ltr" />
        <Msg state={state} />
        <motion.button whileTap={{ scale: 0.97 }} disabled={pending} className="btn btn-brand mt-2">{pending ? "..." : "ذخیره و ورود"}</motion.button>
      </form>
    </Shell>
  );
}
