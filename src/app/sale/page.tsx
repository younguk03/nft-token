// src/app/sale/page.tsx
"use client"; // 훅과 이벤트 핸들러를 사용하므로 클라이언트 컴포넌트

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWeb3 } from '../../context/web3Context'; // Web3 Context 훅

// --- 타입 정의 ---

// 스마트 컨트랙트에서 반환되는 NFT 정보 (온체인)
interface OnChainNFT {
  nftTokenId: string;
  nftTokenURI: string;
  price: string; // 'value'로 전송해야 하므로 문자열 유지
}

// IPFS에서 가져오는 메타데이터
interface IpfsMetadata {
  name: string;
  image: string;
}

// 온체인 + 메타데이터가 결합된 최종 NFT 타입
type SaleNft = OnChainNFT & Partial<IpfsMetadata>;

export default function SalePage() {
  // Web3 Context에서 전역 상태 가져오기
  const { web3, accounts, contract, isLoading: isWeb3Loading, error: web3Error } = useWeb3();

  // "판매" 페이지에서 사용할 로컬 상태
  const [nftList, setNftList] = useState<SaleNft[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [approvalState, setApprovalState] = useState<boolean>(false);
  const [resultBrowsers, setResultBrowsers] = useState<string>("Web3 로딩 중...");
  
  // 모달 관련 상태
  const [selectedNft, setSelectedNft] = useState<SaleNft | null>(null);

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

  // Web3 준비가 완료되면 "판매 중인 NFT" 목록을 불러옵니다.
  useEffect(() => {
    // 메타데이터 fetch 함수
    const fetchMetadata = async (uri: string): Promise<Partial<IpfsMetadata>> => {
      try {
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`Failed to fetch metadata from ${uri}`);
        const data: IpfsMetadata = await response.json();
        return { name: data.name, image: data.image };
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        return { name: "메타데이터 로드 실패", image: "" };
      }
    };

    // 판매 중인 NFT 목록과 거래 승인 상태를 불러오는 메인 함수
    const fetchSaleNfts = async () => {
      // web3 준비가 안 되었거나, 계정이 없으면 중단
      if (!contract || accounts.length === 0) return; 

      setIsLoadingList(true);
      try {
        // 1. 거래 승인 상태 조회 (구매 시 필요)
        const state: boolean = await contract.methods.isApprovedForAll(accounts[0], contract.options.address).call();
        setApprovalState(state);

        // 2. 스마트 컨트랙트에서 "판매 중인" NFT 목록 가져오기
        const rawNftList: OnChainNFT[] = await contract.methods.getSaleNftTokens().call();
        
        // 3. 각 NFT의 메타데이터를 병렬로 IPFS에서 가져오기
        const processedList: SaleNft[] = await Promise.all(
          rawNftList.map(async (nft) => {
            const metadata = await fetchMetadata(nft.nftTokenURI);
            return { ...nft, ...metadata }; // 온체인 정보와 메타데이터 결합
          })
        );

        setNftList(processedList);
      } catch (error: any) {
        console.error("Failed to fetch NFT list:", error);
        setResultBrowsers("판매 목록을 불러오는 데 실패했습니다: " + error.message);
      } finally {
        setIsLoadingList(false);
      }
    };

    fetchSaleNfts();
  }, [contract, accounts]); // contract나 accounts가 준비/변경되면 실행

  // === 이벤트 핸들러 ===

  /** 구매하기 버튼 클릭 (모달 열기) */
  const handleBuyClick = (nft: SaleNft) => {
    // 구매할 NFT 정보를 상태에 저장
    setSelectedNft(nft);
  };

  /** 구매 확정 (모달에서 '구매하기' 버튼 클릭) */
  const handleBuySubmit = async () => {
    if (!contract || accounts.length === 0 || !selectedNft) {
      alert("정보가 올바르지 않습니다.");
      return;
    }

    const { nftTokenId, price } = selectedNft;

    try {
      // 1. 소유자 확인 (스스로 구매 방지)
      const ownerAddress: string = await contract.methods.ownerOf(nftTokenId).call();
      if (ownerAddress.toLowerCase() === accounts[0].toLowerCase()) {
        alert("제품 소유자는 구매할 수 없습니다.");
        return;
      }

      // 2. 거래 승인 상태 확인 (컨트랙트가 토큰을 전송할 수 있어야 함)
      if (!approvalState) {
        alert("구매를 위해 '거래상태'를 '거래가능'으로 변경해주세요. (Navbar의 버튼 클릭)");
        return;
      }

      // 3. 구매 트랜잭션 전송 (value에 가격을 실어서 보냄)
      console.log(`Buying token ${nftTokenId} for ${price} wei...`);
      const receiptObj = await contract.methods.buyNftToken(nftTokenId).send({ 
        from: accounts[0], 
        value: price // price가 이미 wei 단위의 문자열이어야 함
      });
      console.log(receiptObj);

      alert("구매가 완료되었습니다. 페이지를 새로고침합니다.");
      window.location.reload();

    } catch (error: any) {
      console.error("Buy submission failed:", error);
      alert("구매 실패: " + error.message);
    }
  };

  /** NFT 삭제 (휴지통 버튼 클릭) */
  const handleBurn = async (tokenId: string) => {
    if (!contract || accounts.length === 0) {
      alert("지갑이 연결되지 않았습니다.");
      return;
    }
    
    if (window.confirm('삭제하시면 복구할 수 없습니다. \n정말로 삭제하시겠습니까??')) {
      try {
        const receiptObj = await contract.methods.burn(tokenId).send({ from: accounts[0] });
        console.log(receiptObj);
        
        // 상태에서 즉시 제거
        setNftList(currentList => currentList.filter(nft => nft.nftTokenId !== tokenId));
        alert("삭제가 완료되었습니다.");

      } catch (error: any) {
        console.error("Burn failed:", error);
        alert("삭제 실패: " + error.message);
      }
    }
  };
  
  return (
    <>
      <div className="container">
        <br />
        <h1 className="bd-title text-center">판매하기</h1>

        <div className="input-group mb-3">
          <div className="col-12 py-3">
            <span className="form-control" id="resultbrowsers">
              {resultBrowsers}
            </span>
          </div>
          <div className="input-group-prepend">
            <span className="input-group-text">계정</span>
          </div>
          <span className="form-control" id="showAccount">
            {accounts[0]}
          </span>
        </div>

        <div className="box-body" style={{ minHeight: '500px' }}>
          <table className="table table-hover">
            <thead>
              <tr>
                <th>순서</th>
                <th>TokenId</th>
                <th>금액 (wei)</th>
                <th>창작자</th>
                <th>이미지</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody id="dynamicTbody">
              {isLoadingList ? (
                <tr>
                  <td colSpan={6} className="text-center">판매 목록을 불러오는 중입니다...</td>
                </tr>
              ) : nftList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">판매 중인 NFT가 없습니다.</td>
                </tr>
              ) : (
                nftList.map((nft, index) => (
                  <tr key={nft.nftTokenId?.toString()}> {/* ⭐️ .toString() 추가 */}
                    <td>{index + 1}</td>
                    
                    {/* ⭐️ .toString()을 사용해 bigint를 문자열로 변환 */}
                    <td>{nft.nftTokenId?.toString() ?? 'N/A'}</td>
                    
                    {/* ⭐️ .toString()을 사용해 bigint를 문자열로 변환 */}
                    <td>{nft.price?.toString() ?? '0'}</td>

                    <td>{nft.name}</td>
                    <td>
                      {nft.image ? (
                        <img src={nft.image} width="100px" alt={nft.name || 'NFT Image'} />
                      ) : (
                        '이미지 없음'
                      )}
                    </td>
                    <td>
                      <Link 
                        href={`/mynft/mynft-detail?pageInfo=sale&tokenId=${nft.nftTokenId?.toString()}`}
                        className="btn btn-secondary btn-flat"
                      >
                        상세보기
                      </Link>
                      &nbsp;

                      {/* (이하 버튼 코드는 동일) */}
                      <button 
                        type="button" 
                        className="btn btn-success btn_buy" 
                        data-bs-toggle="modal"
                        data-bs-target="#saleModal"
                        onClick={() => handleBuyClick(nft)}
                      >
                        구매하기
                      </button>
                      &nbsp;
                      <button 
                        type="button" 
                        className="btn btn-danger btn_burn"
                        onClick={() => handleBurn(nft.nftTokenId.toString())}
                      >
                        삭제하기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 구매 모달 (Bootstrap) */}
      <div className="modal fade" id="saleModal" tabIndex={-1} aria-labelledby="buyModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="buyModalLabel">구매하기 (Token: {selectedNft?.nftTokenId})</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <label htmlFor="price" className="form-label">구매 가격 (wei)</label>
              <input 
                type="number" 
                className="form-control" 
                id="price" 
                value={selectedNft?.price ?? 0}
                readOnly // 구매 시 가격은 고정
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button 
                type="button" 
                className="btn btn-primary btn_buySubmit"
                onClick={handleBuySubmit}
                data-bs-dismiss="modal"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}