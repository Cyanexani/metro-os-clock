import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@metro_settings';

const DEFAULTS = {
  use24Hour: false,
  showSeconds: false,
  weekStartsMonday: false,
  vibrateOnAlarm: true,
  batteryPromptShown: false,
};

const SettingsContext = createContext({
  settings: DEFAULTS,
  setSetting: () => {},
  loaded: false,
});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const setSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
