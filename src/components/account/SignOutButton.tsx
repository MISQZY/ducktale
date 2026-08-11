import { signOut } from "@/auth";
import { FormButton } from "@/components/common/FormButton";

export function SignOutButton({ label, lang }: { label: string; lang: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: `/${lang}` });
      }}
    >
      <FormButton type="submit" variant="outline">
        {label}
      </FormButton>
    </form>
  );
}
