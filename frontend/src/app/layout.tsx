import ReduxProvider from '@/store/ReduxProvider';
import AiChatWidget from '../components/ai/AiChatWidget';
import  "bootstrap/dist/css/bootstrap.min.css"
import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
            {children}
            <AiChatWidget />
        </ReduxProvider>
      </body>
    </html>
  );
}