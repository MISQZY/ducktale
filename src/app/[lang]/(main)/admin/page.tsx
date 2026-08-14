import { redirect } from "next/navigation";

/** /admin has no content of its own — users is the default admin landing page for now. */
export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  redirect(`/${lang}/admin/users`);
}
