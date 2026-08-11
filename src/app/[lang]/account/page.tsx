import { redirect } from "next/navigation";

/** /account has no page of its own anymore — the dashboard moved to /profile (see src/app/[lang]/profile/page.tsx). Kept as a redirect for old links/bookmarks. */
export default async function AccountIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/profile`);
}
