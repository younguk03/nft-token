// export default function Footer() {
//   return (
//     <footer className="footer" style={{marginTop: '30px'}}>
//       <div className="container">
//         <span className="text-muted">
//           강의 출처 : 인프런 - jQuery로 구현하는 NFT 마켓플레이스 (이더리움, 폴리곤)
//         </span>
//       </div>
//     </footer>
//   );
// }

// src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer" style={{ marginTop: '30px' }}>
      <div className="container">
        <span className="text-muted">강의 출처 : 인프런 - jQuery로 구현하는 NFT 마켓플레이스 (이더리움, 폴리곤)- 김영욱 92212788</span>
      </div>
    </footer>
  );
};

export default Footer;