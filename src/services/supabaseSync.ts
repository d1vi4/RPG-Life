import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Category, GlobalState, Task, Penalty, ActivityLog } from '../types';

export interface SupabaseAppState {
  globalState: GlobalState;
  categories: Category[];
  tasks: Task[];
  penalties: Penalty[];
  activityLogs: ActivityLog[];
  dayReasons: Record<string, string>;
  updatedAt?: string;
  version?: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  const url = (metaEnv.VITE_SUPABASE_URL || '').trim();
  const anonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

const TABLE_NAME = 'liferpg_state';
const USER_ROW_ID = 'main_user';

/**
 * Loads entire app state from Supabase table `liferpg_state` for id = 'main_user'.
 */
export async function loadAppStateFromSupabase(
  fallback?: SupabaseAppState
): Promise<SupabaseAppState | null> {
  const client = getSupabase();

  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('id, data, updated_at')
      .eq('id', USER_ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return fallback || null;
    }

    if (data && data.data) {
      const parsedData = data.data as SupabaseAppState;
      return {
        globalState: parsedData.globalState,
        categories: parsedData.categories || [],
        tasks: parsedData.tasks || [],
        penalties: parsedData.penalties || [],
        activityLogs: parsedData.activityLogs || [],
        dayReasons: parsedData.dayReasons || {},
        updatedAt: data.updated_at,
        version: '4.0-supabase-cloud',
      };
    }

    if (fallback) {
      const initPayload = {
        ...fallback,
        updatedAt: new Date().toISOString(),
        version: '4.0-supabase-cloud',
      };

      await client.from(TABLE_NAME).upsert(
        {
          id: USER_ROW_ID,
          data: initPayload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      return initPayload;
    }

    return null;
  } catch (err: any) {
    console.error('Supabase exception during load:', err);
    return fallback || null;
  }
}

/**
 * Saves entire app state to Supabase table `liferpg_state` for id = 'main_user'.
 */
export async function saveAppStateToSupabase(
  state: Omit<SupabaseAppState, 'updatedAt' | 'version'>
): Promise<boolean> {
  const client = getSupabase();

  if (!client) {
    return false;
  }

  const payload: SupabaseAppState = {
    ...state,
    updatedAt: new Date().toISOString(),
    version: '4.0-supabase-cloud',
  };

  try {
    const { error } = await client
      .from(TABLE_NAME)
      .upsert(
        {
          id: USER_ROW_ID,
          data: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Supabase auto-save error:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Supabase auto-save exception:', err);
    return false;
  }
}
