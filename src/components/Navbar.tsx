// 'use client';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { useWeb3 } from '@/context/web3Context';

// export default function Navbar() {
//   const pathname = usePathname();
//   const { account, isApproved, contract, checkApproval } = useWeb3();

//   const handleApprovalToggle = async () => {
//     if (!contract || !account) return;
//     try {
//       await contract.methods
//         .setApprovalForAll(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, true)
//         .send({ from: account });
//       await checkApproval();
//       window.location.reload();
//     } catch (error) {
//       console.error('Failed to set approval:', error);
//     }
//   };

//   return (
//     <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
//       <div className="container">
//         <a className="navbar-brand" href="/">dlwltn98 NFT</a>
//         <button 
//           className="navbar-toggler" 
//           type="button" 
//           data-bs-toggle="collapse" 
//           data-bs-target="#navbarsExample07"
//         >
//           <span className="navbar-toggler-icon"></span>
//         </button>
//         <div className="collapse navbar-collapse" id="navbarsExample07">
//           <ul className="navbar-nav me-auto mb-2 mb-lg-0">
//             <li className="nav-item">
//               <Link 
//                 className={`nav-link ${pathname === '/' ? 'active' : ''}`} 
//                 href="/"
//               >
//                 민팅하기
//               </Link>
//             </li>
//             <li className="nav-item">
//               <Link 
//                 className={`nav-link ${pathname === '/mynft' ? 'active' : ''}`}
//                 href="/mynft"
//               >
//                 My-NFT
//               </Link>
//             </li>
//             <li className="nav-item">
//               <Link 
//                 className={`nav-link ${pathname === '/sale' ? 'active' : ''}`}
//                 href="/sale"
//               >
//                 판매
//               </Link>
//             </li>
//           </ul>
//           <div className="d-flex">
//             <button 
//               type="button" 
//               className="btn btn-warning col-md-6" 
//               style={{width: '200px'}}
//               onClick={handleApprovalToggle}
//             >
//               거래상태 : {isApproved ? '거래가능' : '거래중지'}
//             </button>
//             &nbsp;&nbsp;
//             <span className="col-md-7">
//               <select className="form-select">
//                 <option value="MATIC_MUMBAI">폴리곤-뭄바이</option>
//               </select>
//             </span>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// src/components/Navbar.tsx
"use client"; // 훅과 상태를 사용하므로 클라이언트 컴포넌트

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Next.js의 Link 컴포넌트 사용
import { useWeb3 } from '../context/web3Context'; // 커스텀 훅 임포트

const Navbar: React.FC = () => {
  const { accounts, contract } = useWeb3(); // Context에서 상태 가져오기
  const [approvalButtonText, setApprovalButtonText] = useState<string>("거래상태 확인 중...");

  // 컨트랙트와 계정 정보가 준비되면 거래 승인 상태를 확인
  useEffect(() => {
    const checkApproval = async () => {
      if (contract && accounts.length > 0) {
        try {
          const contractAddr = contract.options.address; // 컨트랙트 주소
          const approvalState: boolean = await contract.methods.isApprovedForAll(accounts[0], contractAddr).call();
          setApprovalButtonText(approvalState ? "거래상태 : 거래가능" : "거래상태 : 거래중지");
        } catch (error) {
          console.error("Failed to check approval:", error);
          setApprovalButtonText("상태 확인 실패");
        }
      }
    };
    checkApproval();
  }, [contract, accounts]); // contract 또는 accounts가 변경될 때마다 재실행

  // 거래 승인 핸들러
  const handleSetApproval = async () => {
    if (!contract || accounts.length === 0) {
      alert("먼저 메타마스크를 연결해주세요.");
      return;
    }
    try {
      const contractAddr = contract.options.address;
      const receiptObj = await contract.methods.setApprovalForAll(contractAddr, true).send({ from: accounts[0] });
      console.log(receiptObj);
      alert("거래 승인이 완료되었습니다. 페이지를 새로고침합니다.");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(`거래 승인 실패: ${error.message}`);
    }
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" aria-label="Eighth navbar example">
      <div className="container">
        <Link className="navbar-brand" href="/">dlwltn98 NFT</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample07"
            aria-controls="navbarsExample07" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarsExample07">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                    {/* <a> 태그 대신 <Link> 사용 */}
                    <Link className="nav-link active" aria-current="page" href="/">민팅하기</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" href="/mynft">My-NFT</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" href="/sale">판매</Link>
                </li>
            </ul>
            <div className="d-flex">
                <button 
                    type="button" 
                    className="btn btn-warning col-md-6"
                    style={{ width: '200px' }}
                    onClick={handleSetApproval}
                >
                    {approvalButtonText}
                </button>
                &nbsp;&nbsp;
                <span className="col-md-7">
                    <select className="form-select" aria-label="블록체인 네트워크" defaultValue="MATIC_MUMBAI">
                        <option value="MATIC_MUMBAI">폴리곤-뭄바이</option>
                    </select>
                </span>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;