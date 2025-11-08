// 'use client';
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { connectWallet, getContract } from '@/lib/web3';

// interface Web3ContextType {
//   account: string | null;
//   web3: any;
//   contract: any;
//   isConnected: boolean;
//   isApproved: boolean;
//   connectWallet: () => Promise<void>;
//   checkApproval: () => Promise<void>;
// }

// const Web3Context = createContext<Web3ContextType>({
//   account: null,
//   web3: null,
//   contract: null,
//   isConnected: false,
//   isApproved: false,
//   connectWallet: async () => {},
//   checkApproval: async () => {},
// });

// export const useWeb3 = () => useContext(Web3Context);

// export const Web3Provider: React.FC<{ children: React.ReactNode; abi: any }> = ({
//   children,
//   abi,
// }) => {
//   const [account, setAccount] = useState<string | null>(null);
//   const [web3, setWeb3] = useState<any>(null);
//   const [contract, setContract] = useState<any>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [isApproved, setIsApproved] = useState(false);

//   const handleConnectWallet = async () => {
//     try {
//       const { web3: w3, account: acc } = await connectWallet();
//       setWeb3(w3);
//       setAccount(acc);
//       setIsConnected(true);

//       const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
//       const contractInstance = getContract(w3, abi, contractAddress);
//       setContract(contractInstance);
//     } catch (error) {
//       console.error('Wallet connection failed:', error);
//     }
//   };

//   const checkApproval = async () => {
//     if (contract && account) {
//       try {
//         const approved = await contract.methods
//           .isApprovedForAll(account, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
//           .call();
//         setIsApproved(approved);
//       } catch (error) {
//         console.error('Failed to check approval:', error);
//       }
//     }
//   };

//   useEffect(() => {
//     handleConnectWallet();
//   }, []);

//   useEffect(() => {
//     if (contract && account) {
//       checkApproval();
//     }
//   }, [contract, account]);

//   return (
//     <Web3Context.Provider
//       value={{
//         account,
//         web3,
//         contract,
//         isConnected,
//         isApproved,
//         connectWallet: handleConnectWallet,
//         checkApproval,
//       }}
//     >
//       {children}
//     </Web3Context.Provider>
//   );
// };
// src/context/web3Context.tsx
"use client"; // Context Provider는 클라이언트 컴포넌트여야 합니다.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3, { Contract } from 'web3';
import { abi, contractAddress } from '../lib/web3'; // lib에서 ABI와 주소 가져오기

// window.ethereum 객체 타입 정의
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}
declare global {
  interface Window { ethereum?: EthereumProvider; }
}

// Context가 제공할 상태의 타입
interface Web3ContextState {
  web3: Web3 | null;
  accounts: string[];
  contract: Contract<any> | null;
  isLoading: boolean;
  error: string | null;
}

// Context 생성 (기본값)
const Web3Context = createContext<Web3ContextState>({
  web3: null,
  accounts: [],
  contract: null,
  isLoading: true,
  error: null,
});

// Provider 컴포넌트 생성
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [contract, setContract] = useState<Contract<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Web3 초기화 로직
    const initWeb3 = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // 1. 계정 정보 요청
          const requestedAccounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccounts(requestedAccounts);

          // 2. Web3 인스턴스 생성
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          // 3. 컨트랙트 인스턴스 생성
          const contractInstance = new web3Instance.eth.Contract(abi, contractAddress);
          setContract(contractInstance);
          
          console.log("Web3 context initialized.");
          setError(null);
        } catch (error: any) {
          console.error("Failed to init Web3 context:", error.message);
          setError("메타마스크 연결에 실패했습니다: " + error.message);
        }
      } else {
        console.error("MetaMask not found. Please install MetaMask.");
        setError("메타마스크를 찾을 수 없습니다. 설치해주세요.");
      }
      setIsLoading(false);
    };

    initWeb3();
  }, []); // 컴포넌트 마운트 시 1회 실행

  return (
    <Web3Context.Provider value={{ web3, accounts, contract, isLoading, error }}>
      {children}
    </Web3Context.Provider>
  );
};

// Context를 쉽게 사용하기 위한 커스텀 훅
export const useWeb3 = () => useContext(Web3Context);