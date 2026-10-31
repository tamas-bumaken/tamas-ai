import { getCurrentProfile } from "@/lib/auth";
import { SidebarUserMenu } from "./sidebar-user-menu";

export async function SidebarUser() {
  const profile = await getCurrentProfile();

  return <SidebarUserMenu username={profile.username} />;
}
