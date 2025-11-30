'use client';

import { useEffect, useState, useCallback } from 'react';

type TabStatus = 'focused' | 'switched' | 'unknown';

interface TabSwitchInfo {
  status: TabStatus;
  isEducational: boolean;
  currentUrl?: string;
  timestamp: number;
}

// Educational domains/keywords that are allowed
const EDUCATIONAL_KEYWORDS = [
  'google.com',
  'youtube.com',
  'khanacademy.org',
  'coursera.org',
  'edx.org',
  'udemy.com',
  'wikipedia.org',
  'stackoverflow.com',
  'github.com',
  'docs.google.com',
  'drive.google.com',
  'classroom.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'canvas',
  'blackboard',
  'moodle',
  'edu',
  'scholar',
  'research',
  'academic',
];

const isEducationalUrl = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return EDUCATIONAL_KEYWORDS.some((keyword) => lowerUrl.includes(keyword));
};

export const useTabSwitching = (enabled: boolean = true) => {
  const [tabInfo, setTabInfo] = useState<TabSwitchInfo>({
    status: 'focused',
    isEducational: true,
    timestamp: Date.now(),
  });

  const checkTabStatus = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const isVisible = !document.hidden;
    const isFocused = document.hasFocus();

    if (isVisible && isFocused) {
      setTabInfo((prev) => ({
        ...prev,
        status: 'focused',
        timestamp: Date.now(),
      }));
    } else {
      // Tab switched or window not focused
      const currentUrl = window.location.href;
      const isEducational = isEducationalUrl(currentUrl);

      setTabInfo({
        status: 'switched',
        isEducational,
        currentUrl,
        timestamp: Date.now(),
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Check initial state
    checkTabStatus();

    // Listen to visibility changes
    document.addEventListener('visibilitychange', checkTabStatus);
    window.addEventListener('focus', checkTabStatus);
    window.addEventListener('blur', checkTabStatus);

    // Periodic check (every 2 seconds)
    const interval = setInterval(checkTabStatus, 2000);

    return () => {
      document.removeEventListener('visibilitychange', checkTabStatus);
      window.removeEventListener('focus', checkTabStatus);
      window.removeEventListener('blur', checkTabStatus);
      clearInterval(interval);
    };
  }, [enabled, checkTabStatus]);

  return tabInfo;
};

