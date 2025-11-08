// import Web3 from 'web3';

// declare global {
//   interface Window {
//     ethereum?: any;
//     web3?: any;
//   }
// }

// export const connectWallet = async () => {
//   if (typeof window.ethereum !== 'undefined') {
//     try {
//       const accounts = await window.ethereum.request({
//         method: 'eth_requestAccounts'
//       });
//       const web3Instance = new Web3(window.ethereum);
//       return { web3: web3Instance, account: accounts[0] };
//     } catch (error) {
//       console.error('Failed to connect wallet:', error);
//       throw error;
//     }
//   } else {
//     throw new Error('MetaMask not installed');
//   }
// };

// export const getContract = (web3: any, abi: any, address: string) => {
//   return new web3.eth.Contract(abi, address);
// };



// src/lib/web3.ts
import { AbiItem } from 'web3';
// abis 폴더에서 JSON 파일 임포트
import MinNftToken from '../abis/MinNftToken.json'; 

// JSON 파일에서 ABI 부분을 'any'로 가져온 후 AbiItem[]로 타입 캐스팅
export const abi = MinNftToken as AbiItem[];

// 여기에 실제 배포된 컨트랙트 주소를 입력해야 합니다.
export const contractAddress: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xYourContractAddressHere';