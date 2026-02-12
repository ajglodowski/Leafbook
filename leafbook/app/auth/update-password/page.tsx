import { UpdatePasswordForm } from "@/app/auth/update-password/update-password-form";
import { LeafbookLogo } from "@/components/LeafbookLogo";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <LeafbookLogo width={96} height={115} />
          <h1 className="font-serif text-2xl font-semibold text-primary">Leafbook</h1>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
