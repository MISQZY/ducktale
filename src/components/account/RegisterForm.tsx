"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/common/FormInput";
import { FormButton } from "@/components/common/FormButton";
import { Link } from "@/i18n/navigation";

export function RegisterForm() {
  const t = useTranslations("Account.register");
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? t("errors.generic"));
        return;
      }

      const signInResult = await signIn("credentials", {
        nickname,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(t("errors.generic"));
        return;
      }

      router.push("/profile");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        id="nickname"
        label={t("nicknameLabel")}
        hint={t("nicknameHint")}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        autoComplete="username"
        required
        minLength={3}
        maxLength={32}
      />
      <FormInput
        id="password"
        type="password"
        label={t("passwordLabel")}
        hint={t("passwordHint")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <FormInput
        id="confirmPassword"
        type="password"
        label={t("confirmPasswordLabel")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <FormButton type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>

      <p className="text-sm text-foreground/45 text-center">
        {t("haveAccount")}{" "}
        <Link href="/account/login" className="text-primary/80 hover:text-primary">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
