"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormInput } from "@/components/common/FormInput";
import { FormButton } from "@/components/common/FormButton";
import { Link } from "@/i18n/navigation";

export function LoginForm() {
  const t = useTranslations("Account.login");
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        nickname,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errors.invalidCredentials"));
        return;
      }

      router.push("/profile");
    } catch {
      setError(t("errors.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormInput
        id="nickname"
        label={t("nicknameLabel")}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        autoComplete="username"
        required
      />
      <FormInput
        id="password"
        type="password"
        label={t("passwordLabel")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <FormButton type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? t("submitting") : t("submit")}
      </FormButton>

      <p className="text-sm text-foreground/45 text-center">
        {t("noAccount")}{" "}
        <Link href="/account/register" className="text-primary/80 hover:text-primary">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
