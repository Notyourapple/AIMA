import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'AI Marketplace Assistant | Autonomous Conversational Shopping & Vector Recommendations',
  description: 'Autonomous conversational AI shopping agent powered by OpenAI embeddings, LangChain orchestration, and Pinecone vector search.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 antialiased flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <AppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
