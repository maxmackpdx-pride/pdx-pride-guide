import {type ReactNode} from 'react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {AuthPresentationProvider,type AuthContextType} from '@/context/AuthContext';
import {queryClient as nativeQueryClient} from '@/lib/queryClient';
import {ThemeProvider} from '@/context/ThemeContext';
/** Host-provided auth, no implicit login/session probe. Native API adapters require same-origin Zaylist APIs and the default profileQueryClient. Custom clients are for data-only exports. */
export function ProfileObjectRuntime({children,auth,queryClient}:{children:ReactNode;auth:AuthContextType;queryClient?:QueryClient}){return <QueryClientProvider client={queryClient||nativeQueryClient}><AuthPresentationProvider value={auth}><ThemeProvider>{children}</ThemeProvider></AuthPresentationProvider></QueryClientProvider>;}
