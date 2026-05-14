import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export function useAccessibilityStatus() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MyModule = require('@/modules/my-module').default;
      setIsEnabled(!!MyModule.isAccessibilityServiceEnabled());
    } catch {
      setIsEnabled(false);
    }
  }, []);

  const openSettings = useCallback(() => {
    if (Platform.OS !== 'android') return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MyModule = require('@/modules/my-module').default;
      MyModule.openAccessibilitySettings();
    } catch {}
  }, []);

  return { isEnabled, openSettings };
}
