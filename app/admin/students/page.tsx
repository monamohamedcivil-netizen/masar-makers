import { redirect } from "next/navigation";

export default function StudentsPage() {
  redirect("/admin/students/enrollment-requests");
}