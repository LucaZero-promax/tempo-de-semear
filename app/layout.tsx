import type { Metadata } from 'next';
import './globals.css';
import './home.css';

export const metadata: Metadata = {
  title: 'Tempo de Semear | Itapecuru Mirim',
  description: 'Portal oficial de consulta do programa Tempo de Semear.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
