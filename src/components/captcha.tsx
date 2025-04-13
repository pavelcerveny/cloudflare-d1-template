'use client'

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { FormMessage } from './ui/form';
import { CAPTCHA_ENABLED } from '@/featureFlags';

const Turnstile = dynamic(() => import('@marsidev/react-turnstile').then(mod => mod.Turnstile), {
  ssr: false,
})

type Props = Omit<ComponentProps<typeof Turnstile>, 'siteKey'> & {
  validationError?: string
}

export const Captcha = ({
  validationError,
  ...props
}: Props) => {

  return (
    CAPTCHA_ENABLED ? (
      <>
        <Turnstile
          options={{
            size: 'flexible',
            language: 'auto',
          }}
          {...props}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
        />

        {validationError && (
          <FormMessage className="text-red-500 mt-2">
            {validationError}
          </FormMessage>
        )}
      </>
    ) : null
  )
}
