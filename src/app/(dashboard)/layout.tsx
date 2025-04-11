
import {
  SidebarProvider,
} from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { cn } from "@/lib/utils"
import SkipToMain from "@/components/admin/skip-to-main"
import { AppSidebar } from "@/components/admin/layout/app-sidebar"
import { Header } from '@/components/admin/layout/header'
import { TopNav } from '@/components/admin/layout/top-nav'
import { ProfileDropdown } from '@/components/admin/profile-dropdown'
import { Search } from '@/components/admin/search'
import ThemeSwitch from '@/components/theme-switch'
import { Main } from '@/components/admin/layout/main'

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]

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
          {/* ===== Top Heading ===== */}
          <Header>
            <TopNav links={topNav} />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </Header>
          <Main>{children}</Main>
        </div>
      </SidebarProvider>

  )
}
