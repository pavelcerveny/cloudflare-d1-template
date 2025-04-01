"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Suspense, useEffect } from "react"
import { EmailVerificationDialog } from "./email-verification-dialog"
import { useTopLoader } from 'nextjs-toploader'
import { usePathname, useRouter, useSearchParams, useParams } from "next/navigation"

function RouterChecker() {
  const { start, done } = useTopLoader()
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const _push = router.push.bind(router);
    const _refresh = router.refresh.bind(router);

    // Monkey patch: https://github.com/vercel/next.js/discussions/42016#discussioncomment-9027313
    router.push = (href, options) => {
      start();
      _push(href, options);
    };

    // Monkey patch: https://github.com/vercel/next.js/discussions/42016#discussioncomment-9027313
    router.refresh = () => {
      start();
      _refresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, params]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

  return (
    <>
      <Suspense>
        <RouterChecker />
      </Suspense>
      <NextThemesProvider {...props} attribute="class">
        {children}
        <EmailVerificationDialog />
      </NextThemesProvider>
    </>
  )
}
