
import {
  SidebarProvider,
} from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { cn } from "@/lib/utils"
import SkipToMain from "@/components/skip-to-main"
import { AppSidebar } from "@/components/admin/layout/app-sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    return redirect('/')
  }

  return (
      <SidebarProvider defaultOpen={true}>
        <SkipToMain />
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] duration-200 ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
          )}
        >
          {children}
        </div>
      </SidebarProvider>

  )
}
