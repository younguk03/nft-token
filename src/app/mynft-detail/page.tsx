// src/app/mynft/mynft-detail/page.tsx
"use client"; // 훅을 사용하므로 클라이언트 컴포넌트

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation'; // URL 파라미터를 읽기 위해 임포트
import { useWeb3 } from '@/context/web3Context'; // Web3 Context 훅

// --- 타입 정의 ---

// IPFS에서 가져오는 메타데이터 타입
interface NftDetail {
  name: string;
  image: string;
  description: string;
  category: string;
}

export default function MyNftDetailPage() {
  // Web3 Context에서 전역 상태 가져오기
  const { accounts, contract, isLoading: isWeb3Loading, error: web3Error } = useWeb3();
  
  // Next.js 훅을 사용하여 URL 쿼리 파라미터 읽기
  const searchParams = useSearchParams();
  const tokenId = searchParams.get('tokenId'); // ?tokenId=...
  const pageInfo = searchParams.get('pageInfo'); // ?pageInfo=...

  // "상세내용" 페이지에서 사용할 로컬 상태
  const [nftDetail, setNftDetail] = useState<NftDetail | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState<boolean>(true);
  const [resultBrowsers, setResultBrowsers] = useState<string>("Web3 로딩 중...");
  const [backHref, setBackHref] = useState<string>('/mynft'); // "목록으로" 버튼의 기본 URL

  // Web3 Context 상태가 변경될 때마다 UI 업데이트
  useEffect(() => {
    if (isWeb3Loading) {
      setResultBrowsers("메타마스크 연결 중...");
    } else if (web3Error) {
      setResultBrowsers(web3Error);
    } else if (accounts.length > 0) {
      setResultBrowsers("메타마스크 연결 완료");
    } else {
      setResultBrowsers("메타마스크에 로그인 해주세요.");
    }
  }, [isWeb3Loading, web3Error, accounts]);

  // "목록으로" 버튼의 URL을 pageInfo 파라미터에 따라 동적으로 설정
  useEffect(() => {
    if (pageInfo === 'sale') {
      setBackHref('/sale');
    } else if (pageInfo === 'myNFT') {
      setBackHref('/mynft');
    }
  }, [pageInfo]); // pageInfo 값이 확정되면 실행

  // Web3 준비가 완료되고 tokenId가 있으면 NFT 상세 정보를 불러옵니다.
  useEffect(() => {
    // jQuery의 ipfsInfo() 함수를 대체하는 비동기 fetch 함수
    const fetchMetadata = async (uri: string): Promise<NftDetail> => {
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata from ${uri}`);
        }
        const data = await response.json();
        
        // 원본 코드의 attributes[0].value 로직을 안전하게 처리
        const category = data.attributes?.[0]?.value || '카테고리 없음';
        
        return {
          name: data.name,
          image: data.image,
          description: data.description,
          category: category,
        };
      } catch (error) {
        console.error("Failed to fetch or parse metadata:", error);
        throw new Error("메타데이터 파싱 실패");
      }
    };

    // NFT 상세 정보를 불러오는 메인 함수
    const fetchNftDetail = async () => {
      // 컨트랙트나 tokenId가 없으면 실행 중지
      if (!contract || !tokenId) return;

      setIsFetchingDetail(true);
      try {
        // 1. 컨트랙트에서 tokenURI 조회
        const tokenURI: string = await contract.methods.tokenURI(tokenId).call();
        
        // 2. tokenURI(IPFS/HTTP URL)로 메타데이터 조회
        const metadata = await fetchMetadata(tokenURI);
        setNftDetail(metadata);

      } catch (error: any) {
        console.error("Failed to fetch NFT detail:", error);
        setResultBrowsers("NFT 상세 정보를 불러오는 데 실패했습니다: " + error.message);
      } finally {
        setIsFetchingDetail(false);
      }
    };

    fetchNftDetail();
  }, [contract, tokenId]); // contract나 tokenId가 변경/확정되면 실행

  return (
    <div className="container">
      <br />
      <h1 className="bd-title text-center">상세내용</h1>
      <div className="box-body">

        <div className="col-12 py-3">
          <span className="form-control" id="resultbrowsers">
            {resultBrowsers}
          </span>
        </div>

        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text">계정</span>
          </div>
          <span className="form-control" id="showAccount">
            {accounts[0]}
          </span>
        </div>

        {/* NFT 상세 정보 표시 (로딩 및 데이터 상태에 따라 분기) */}
        {isFetchingDetail ? (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>NFT 상세 정보를 불러오는 중입니다...</p>
          </div>
        ) : !nftDetail ? (
          <div className="alert alert-danger" role="alert">
            NFT 정보를 불러오는 데 실패했습니다.
          </div>
        ) : (
          <>
            <div className="col-12">
              <label htmlFor="name" className="form-label">발행자</label>
              <span className="form-control" id="name">
                {nftDetail.name}
              </span>
            </div>

            <div className="col-12 py-3">
              <label htmlFor="uploadfile" className="form-label">대표이미지</label>
              <div className="input-group input-group-sm">
                {nftDetail.image ? (
                  <img 
                    id="imgurl" 
                    src={nftDetail.image} 
                    className="img-fluid img-thumbnail" 
                    style={{ width: '300px' }} 
                    alt={nftDetail.name} 
                  />
                ) : (
                  <span className="form-control">이미지가 없습니다.</span>
                )}
              </div>
            </div>

            <div className="col-12 py-3">
              <div className="form-group">
                <label htmlFor="category">카테고리</label>
                <span className="form-control" id="category">
                  {nftDetail.category}
                </span>
              </div>
            </div>

            <div className="col-12">
              <label htmlFor="description" className="form-label">description</label>
              <span className="form-control" id="description" style={{ minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                {nftDetail.description}
              </span>
            </div>
          </>
        )}

        <div className="col-12 mt-5"></div>
        
        {/* "목록으로" 버튼 (Link 컴포넌트 사용) */}
        <Link 
          href={backHref} 
          className="btn btn-primary" 
          style={{ color: 'white', textDecorationLine: 'none' }}
        >
          목록으로
        </Link>
      </div>
    </div>
  );
}