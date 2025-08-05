"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { 
  Shield, 
  Home, 
  Scan, 
  FileText, 
  Settings, 
  History,
  User,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useClientAuth } from "@/hooks/useClientAuth";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "New Scan",
      url: "/dashboard/scan",
      icon: Scan,
    },
    {
      title: "Scan History",
      url: "/dashboard/history",
      icon: History,
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: FileText,
    },
  ],
};

export function AppSidebar() {
  const { user, signOut } = useClientAuth();

  return (
    <Sidebar variant="floating" collapsible="icon" className="border border-gray-800 bg-gray-900/80 backdrop-blur-md">
      <SidebarHeader className="border-gray-800 p-4 group-data-[collapsible=icon]:p-3">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-8 h-8 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:h-6 text-purple-400" />
            <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              SecCheck
            </span>
            <span className="text-xs text-gray-400">Security Scanner</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:px-unset">
          <SidebarGroupLabel className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-2 group-data-[collapsible=icon]:hidden">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.title}
                    className="text-gray-300 hover:text-white hover:bg-purple-900/30 data-[active=true]:bg-purple-900/50 data-[active=true]:text-purple-200 rounded-lg transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-gray-800 p-4 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-white truncate">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip="Settings"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
            >
              <Link href="/dashboard/settings">
                <Settings className="w-4 h-4 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sign Out"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-red-900/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}