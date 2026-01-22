import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin | Leafbook",
  description: "Admin tools and catalog management",
};

export default function AdminPage() {
  // Redirect to plant-types by default
  redirect("/admin/plant-types");
}
