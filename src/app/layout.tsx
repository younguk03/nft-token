// import type { Metadata } from 'next';
// import { Web3Provider } from '@/context/web3Context';
// import Navbar from '@/components/Navbar';
// import Footer from '@/components/Footer';
// import './globals.css';

// // ABI는 별도 파일에서 import
// import MinNftToken from '@/abis/MinNftToken.json'

// export const metadata: Metadata = {
//   title: 'NFT Marketplace',
//   description: 'NFT 마켓플레이스',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="ko">
//       <head>
//         <link
//           href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
//           rel="stylesheet"
//           integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3"
//           crossOrigin="anonymous"
//         />
//       </head>
//       <body>
//         <Web3Provider abi={MinNftToken}>
//           <Navbar />
//           {children}
//           <Footer />
//         </Web3Provider>
//         <script 
//           src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
//           integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
//           crossOrigin="anonymous"
//         ></script>
//       </body>
//     </html>
//   );
// }

// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { Web3Provider } from '../context/web3Context'; // Web3 Provider 임포트
import Navbar from '../components/Navbar'; // Navbar 임포트
import Footer from '../components/Footer'; // Footer 임포트
import './globals.css'; // 전역 CSS

// SEO 및 탭 제목 설정
export const metadata: Metadata = {
  title: 'dlwltn98 NFT (App Router)',
  description: 'IPFS와 Web3를 이용한 NFT 민팅 마켓플레이스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Bootstrap CSS */}
        <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
            rel="stylesheet"
            integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3"
            crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* 모든 컴포넌트를 Web3Provider로 감싸야 context 사용 가능 */}
        <Web3Provider>
          <Navbar />
          <main>
            {/* page.tsx의 내용이 children으로 들어옵니다 */}
            {children} 
          </main>
          <Footer />
        </Web3Provider>
        
        {/* Bootstrap JS */}
        <Script 
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
            crossOrigin="anonymous"
            strategy="afterInteractive" // 페이지 로드 후 스크립트 실행
        />
      </body>
    </html>
  );
}