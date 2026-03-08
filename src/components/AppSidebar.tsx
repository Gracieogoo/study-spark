import { BookOpen, Timer, BarChart3, BrainCircuit, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import neuralLogo from "@/assets/neural-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Subjects", url: "/", icon: BookOpen },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "AI Quiz", url: "/quiz", icon: BrainCircuit },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2.5 px-4 py-5">
          <img src={neuralLogo} alt="Neural Guide" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-sidebar-accent-foreground">
              Neural Guide
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
