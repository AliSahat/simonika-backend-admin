import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <div>
        <Head>
          <title>SIMONIKA</title>
        </Head>
      </div>
      <div>
        <Component {...pageProps} />;
      </div>
    </div>
  );
}
