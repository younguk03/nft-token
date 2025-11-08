// export const uploadFileToIPFS = async (file: File) => {
//   const formData = new FormData();
//   formData.append('filename', file);

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_IPFS_API_URL}/api/v0/add`,
//     {
//       method: 'POST',
//       body: formData,
//     }
//   );

//   const data = await response.json();
//   return {
//     hash: data.Hash,
//     url: `${process.env.NEXT_PUBLIC_IPFS_GATEWAY2}${data.Hash}`,
//   };
// };

// export const uploadMetadataToIPFS = async (metadata: any) => {
//   const buffer = Buffer.from(JSON.stringify(metadata));
//   const formData = new FormData();
//   const blob = new Blob([buffer], { type: 'application/json' });
//   formData.append('filename', blob);

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_IPFS_API_URL}/api/v0/add`,
//     {
//       method: 'POST',
//       body: formData,
//     }
//   );

//   const data = await response.json();
//   return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY2}${data.Hash}`;
// };

// export const fetchMetadata = async (uri: string) => {
//   const response = await fetch(uri);
//   return await response.json();
// };
// src/lib/ipfs.ts
// import { create, IPFSHTTPClient } from 'ipfs-http-client';
// import { Buffer } from 'buffer';

// // Infura IPFS 설정
// const projectId = ''; // Infura Project ID
// const projectSecret = ''; // Infura Project Secret
// const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");

// // IPFS 클라이언트 인스턴스 생성 (타입 명시)
// export const ipfs: IPFSHTTPClient = create({
//     host: 'ipfs.infura.io',
//     port: 5001,
//     protocol: 'https',
//     headers: {
//         authorization: auth,
//     },
// });

// IPFS 게이트웨이 주소
export const IPFS_URL2 ='http://127.0.0.1:8080/ipfs/';

// IPFS API 응답 타입 (이미지 업로드용)
export interface IpfsAddResponse {
    Hash: string;
    Name: string;
    Size: string;
}