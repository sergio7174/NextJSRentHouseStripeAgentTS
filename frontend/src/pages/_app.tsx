import '@/styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { makeStore } from '../store/store'; // Adjust path to your store file
import { useEffect, useRef } from 'react';
import { setUser } from '@/store/slices/userSlice';
import ToastProvider from "@/utils/ToastProvider";
import AiChatWidget from '../components/ai/AiChatWidget'; // Adjust path if neede

export default function App({ Component, pageProps }: AppProps) {
  // Create a stable store instance across re-renders
  const storeRef = useRef<ReturnType<typeof makeStore> | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && storeRef.current) {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('userChoice');
      // Look for the name across multiple common localStorage keys
      const storedName = 
        localStorage.getItem('userName') || 
        localStorage.getItem('name') || 
        localStorage.getItem('fullName')
      const storedId = localStorage.getItem('userId') || '';
      const storedEmail = localStorage.getItem('userEmail') || '';
        

      if (token && storedRole) {
        // Dispatch directly to the initialized store instance
        storeRef.current.dispatch(
          setUser({
            role: storedRole as any,
            name: storedName,
            id: storedId,
            email: storedEmail,
            isAuthenticated: true,
          })
        );
      }
    }
  }, []);

  return (
    <Provider store={storeRef.current}>
      <ToastProvider>
        <Component {...pageProps} />
        <AiChatWidget />
      </ToastProvider>
    </Provider>
  );
}
