import { useEffect, useState } from 'react';
import { settingsService } from '../services';

const DEFAULT_APPEARANCE = {
  siteName: 'Sử Việt',
  logoUrl: '',
  backgroundUrl: '',
};

const readAppearance = (settings) => {
  const findValue = (key) => settings.find(item => item.key === key)?.value?.trim() || '';

  return {
    siteName: DEFAULT_APPEARANCE.siteName,
    logoUrl: findValue('ui.logo_url'),
    backgroundUrl: findValue('ui.background_url'),
  };
};

const useSystemAppearance = () => {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  useEffect(() => {
    const loadAppearance = () => {
      settingsService.list()
        .then(settings => setAppearance(readAppearance(settings)))
        .catch(error => console.error('Error loading appearance settings:', error));
    };

    const handleAppearanceUpdated = (event) => {
      if (event.detail?.appearance) {
        setAppearance(previous => ({
          ...previous,
          ...event.detail.appearance,
        }));
        return;
      }

      loadAppearance();
    };

    loadAppearance();
    window.addEventListener('history-rag-settings-updated', handleAppearanceUpdated);

    return () => {
      window.removeEventListener('history-rag-settings-updated', handleAppearanceUpdated);
    };
  }, []);

  return appearance;
};

export default useSystemAppearance;
