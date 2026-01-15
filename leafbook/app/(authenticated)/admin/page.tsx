import { redirect } from "next/navigation";

export default function AdminPage() {
  // Redirect to plant-types by default
  redirect("/admin/plant-types");
}
