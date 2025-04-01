import {
    MutationCache,
    QueryClient,
    type QueryClientConfig,
    defaultShouldDehydrateQuery,
  } from "@tanstack/react-query";
  import SuperJSON from "superjson";
  
  interface QueryError extends Error {
    error: string;
    message: string;
    path: string;
    status: number;
    timestamp: string;
  }

  function makeQueryClient(queryClientConfig?: QueryClientConfig) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // With SSR, we usually want to set some default staleTime
          // above 0 to avoid re-fetching immediately on the client
          staleTime: 60 * 1000,
          retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30000),
          retry: (failureCount, error) => {
            if ((error as QueryError).status >= 400) {
              return false;
            }
            return failureCount < 2;
          }
        },
        dehydrate: {
          serializeData: SuperJSON.serialize,
          // include pending queries in dehydration
          shouldDehydrateQuery: (query) =>
            defaultShouldDehydrateQuery(query) ||
            query.state.status === "pending",
        },
        hydrate: {
          deserializeData: SuperJSON.deserialize,
        },
      },
      mutationCache: new MutationCache({
        onSettled: () => {
          queryClient.invalidateQueries();
        },
      }),
      ...queryClientConfig,
    });
  
    return queryClient;
  }
  
  let browserQueryClient: QueryClient | undefined = undefined;
  
  export function getQueryClient(queryClientConfig?: QueryClientConfig) {
    if (typeof window === "undefined") {
      // Server: always make a new query client
      return makeQueryClient(queryClientConfig);
    }
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient)
      browserQueryClient = makeQueryClient(queryClientConfig);
    return browserQueryClient;
  }
  