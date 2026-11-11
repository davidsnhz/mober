import { create } from 'zustand';

import { getRepository } from '@/db';

import { defaultSettings, parseSettings, serializeSetting, type Settings } from './settings';

interface SettingsState {
  settings: Settings;
  /** Carga los ajustes guardados al arrancar. */
  hydrate: (raw: Record<string, string>) => void;
  /** Cambia uno o varios ajustes y los guarda. */
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,

  hydrate: (raw) => set({ settings: parseSettings(raw) }),

  update: async (patch) => {
    set({ settings: { ...get().settings, ...patch } });
    try {
      const repository = await getRepository();
      for (const key of Object.keys(patch) as (keyof Settings)[]) {
        const value = patch[key];
        if (value !== undefined) await repository.setSetting(key, serializeSetting(value));
      }
    } catch (error) {
      console.error('No se pudieron guardar los ajustes', error);
    }
  },
}));
