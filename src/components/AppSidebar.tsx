import { LayoutDashboard, BookOpen, Timer, BarChart3, BrainCircuit, FileText, FileUp, Moon, Sun, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth-context";
import neuralLogo from "@/assets/neural-logo.png";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Notes", url: "/notes", icon: FileText },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "AI Quiz", url: "/quiz", icon: BrainCircuit },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <img src={neuralLogo} alt="Neural Guide" className="h-10 w-10 shrink-0" />
          {!collapsed && (
            <span className="font-display text-xl font-bold text-gradient-brand">
              Neural Guide
            </span>
          )}
        </div>
        <SidebarGroup className="flex-1">
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

        <div className="px-3 py-3 space-y-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60"
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun className="h-4 w-4 mr-2 shrink-0" /> : <Moon className="h-4 w-4 mr-2 shrink-0" />}
            {!collapsed && (dark ? "Light Mode" : "Dark Mode")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent/60"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2 shrink-0" />
            {!collapsed && "Sign Out"}
          </Button>
          {!collapsed && user && (
            <p className="text-xs text-sidebar-foreground/60 truncate px-2">{user.email}</p>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
