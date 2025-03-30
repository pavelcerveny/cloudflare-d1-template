'use client';

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, X } from "lucide-react";

const STORAGE_KEY = 'cookie-consent-banner-collapsed';

export function CookieConsentBanner() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Get initial state from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored));
    }
    setIsHydrated(true);
  }, []);

  const toggleCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  };

  if (!isHydrated) return null; // Prevent flash of content

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-[100] print:hidden",
        isCollapsed && "pointer-events-none" // Make entire container click-through when collapsed
      )}
    >
      <div
        className={cn(
          "transition-all duration-300 ease-in-out transform",
          isCollapsed ? "translate-x-[calc(100%+1rem)] md:translate-x-[calc(100%+1rem)]" : "translate-x-0"
        )}
      >
        <div className="relative flex items-center w-[90vw] md:max-w-[400px]">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-0 h-8 w-8 rounded-full shadow-lg -translate-x-full",
              "bg-background hover:bg-background",
              "border-2 hover:border-border",
              isCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0" // Ensure button is clickable when collapsed
            )}
            onClick={() => toggleCollapsed(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="bg-gray-100 dark:bg-background rounded-lg shadow-xl border-2 relative">
            <Button
              size="icon"
              className="h-6 w-6 absolute -top-3 -right-3 rounded-full shadow-md border border-border"
              onClick={() => toggleCollapsed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center flex-col py-3 px-3">
              <div className="text-tiny text-muted-foreground mt-3">
                This website uses cookies to improve your experience. 
                By continuing to use this website, you agree to our cookie policy.
              </div>
              <Button size="sm" className="mt-4" onClick={() => toggleCollapsed(true)}>
                I agree
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
