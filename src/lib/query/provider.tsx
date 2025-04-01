"use client";

import { QueryClientProvider as RQProvider } from "@tanstack/react-query";
import type { QueryClientConfig } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";
import * as React from "react";
import { getQueryClient } from "./client";

export interface QueryProviderProps extends PropsWithChildren {
  queryClientConfig?: QueryClientConfig;
}

export function QueryProvider(props: QueryProviderProps) {
  const { queryClientConfig, children, ...queryProviderProps } = props;

  const queryClient = getQueryClient(queryClientConfig);

  return (
    <RQProvider {...queryProviderProps} client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </RQProvider>
  );
}
