import {
  AlertTriangle,
  AudioWaveform,
  BellRing,
  Bug,
  CheckSquare,
  Command,
  FileWarning,
  GalleryVerticalEnd,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LockKeyhole,
  MessageSquare,
  Package,
  Palette,
  ServerCrash,
  Settings,
  UserCog,
  UserX,
  Users,
  Wrench,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@admin.com',
    avatar: '',
  },
  teams: [
    {
      name: 'Admin',
      logo: Command,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Billing',
          url: '/dashboard/billing',
          icon: CheckSquare,
        },
        {
          title: 'Marketplace',
          url: '/dashboard/marketplace',
          icon: Package,
        },
        {
          title: 'Chats',
          url: '/dashboard/chats',
          badge: '3',
          icon: MessageSquare,
        },
        {
          title: 'Users',
          url: '/dashboard/users',
          icon: Users,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/dashboard/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/dashboard/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/dashboard/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/dashboard/settings/notifications',
              icon: BellRing,
            },
            {
              title: 'Display',
              url: '/dashboard/settings/display',
              icon: Command,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/dashboard/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
