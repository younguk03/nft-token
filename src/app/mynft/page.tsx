// src/app/mynft/page.tsx
"use client"; // 훅과 이벤트 핸들러를 사용하므로 클라이언트 컴포넌트

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Next.js의 Link 컴포넌트
import { useWeb3 } from '../../context/web3Context'; // Web3 Context 훅

// --- 타입 정의 ---

// 스마트 컨트랙트에서 반환되는 NFT 정보 (온체인)
interface OnChainNFT {
  nftTokenId: string; // web3는 큰 숫자를 문자열로 반환
  nftTokenURI: string;
  price: string; // web3는 uint256을 문자열로 반환
}

// IPFS에서 가져오는 메타데이터
interface IpfsMetadata {
  name: string;
  image: string;
  // description 등 추가 속성이 있을 수 있음
}

// 온체인 + 메타데이터가 결합된 최종 NFT 타입
type MyNft = OnChainNFT & Partial<IpfsMetadata>; // 메타데이터는 로딩 실패할 수 있으므로 Partial

export default function MyNftPage() {
  // Web3 Context에서 전역 상태 가져오기
  const { web3, accounts, contract, isLoading: isWeb3Loading, error: web3Error } = useWeb3();

  // "My NFT" 페이지에서 사용할 로컬 상태
  const [nftList, setNftList] = useState<MyNft[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [approvalState, setApprovalState] = useState<boolean>(false);
  const [resultBrowsers, setResultBrowsers] = useState<string>("Web3 로딩 중...");
  
  // 모달 관련 상태
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const priceRef = useRef<HTMLInputElement>(null); // 판매 가격 입력 Ref

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

  // Web3 준비가 완료되면 "My NFT" 목록을 불러옵니다.
  useEffect(() => {
    // jQuery의 ipfsInfo() 함수를 대체하는 비동기 fetch 함수
    const fetchMetadata = async (uri: string): Promise<Partial<IpfsMetadata>> => {
      try {
        // IPFS 게이트웨이 또는 HTTP URL로 메타데이터 요청
        // 원본의 'async: false' 대신 비동기 'fetch'를 사용합니다.
        const response = await fetch(uri); 
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata from ${uri}`);
        }
        const data: IpfsMetadata = await response.json();
        return { name: data.name, image: data.image };
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        return { name: "메타데이터 로드 실패", image: "" }; // 에러 시 기본값
      }
    };

    // NFT 목록과 거래 승인 상태를 불러오는 메인 함수
    const fetchMyNfts = async () => {
      // 컨트랙트나 계정 정보가 없으면(로딩 중이면) 중단
      if (!contract || accounts.length === 0) return; 

      setIsLoadingList(true);
      try {
        // 1. 거래 승인 상태 조회 (판매 로직에 필요)
        const state: boolean = await contract.methods.isApprovedForAll(accounts[0], contract.options.address).call();
        setApprovalState(state);

        // 2. 스마트 컨트랙트에서 NFT 목록 가져오기
        const rawNftList: OnChainNFT[] = await contract.methods.getNftTokens(accounts[0]).call();
        
        // 3. 각 NFT의 메타데이터를 병렬로 IPFS에서 가져오기 (Promise.all 사용)
        const processedList: MyNft[] = await Promise.all(
          rawNftList.map(async (nft) => {
            const metadata = await fetchMetadata(nft.nftTokenURI);
            return { ...nft, ...metadata }; // 온체인 정보와 메타데이터 결합
          })
        );

        setNftList(processedList);
      } catch (error: any) {
        console.error("Failed to fetch NFT list:", error);
        setResultBrowsers("NFT 목록을 불러오는 데 실패했습니다: " + error.message);
      } finally {
        setIsLoadingList(false);
      }
    };

    fetchMyNfts();
  }, [contract, accounts]); // contract나 accounts가 준비/변경되면 실행

  // === 이벤트 핸들러 ===

  /** 판매 등록 (모달에서 '판매등록하기' 버튼 클릭) */
  const handleSaleSubmit = async () => {
    const price = priceRef.current?.value;
    const tokenId = selectedTokenId; // state에서 선택된 토큰 ID 가져오기

    // 유효성 검사
    if (!contract || accounts.length === 0 || !tokenId || !price || parseFloat(price) < 0) {
      alert("정보가 올바르지 않습니다. (가격: 0 이상)");
      return;
    }

    try {
      // 1. 소유자 확인
      const ownerAddress: string = await contract.methods.ownerOf(tokenId).call();
      if (ownerAddress.toLowerCase() !== accounts[0].toLowerCase()) {
        alert("제품 소유자만 판매등록할 수 있습니다.");
        return;
      }

      // 2. 거래 승인 상태 확인
      if (!approvalState) {
        alert("판매를 위해 '거래상태'를 '거래가능'으로 변경해주세요. (Navbar의 버튼 클릭)");
        return;
      }

      // 3. 판매 등록 트랜잭션 전송
      console.log(`Setting sale for token ${tokenId} at price ${price}`);
      // 원본의 gas: 3000000을 문자열로 전달
      const receiptObj = await contract.methods.setSaleNftToken(tokenId, price).send({ from: accounts[0], gas: "3000000" });
      console.log(receiptObj);

      alert("판매 등록이 완료되었습니다. 페이지를 새로고침합니다.");
      window.location.reload(); // 원본 코드의 location.reload() 동작 유지

    } catch (error: any) {
      console.error("Sale submission failed:", error);
      alert("판매 등록 실패: " + error.message);
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
        // 1. 삭제 트랜잭션 전송
        const receiptObj = await contract.methods.burn(tokenId).send({ from: accounts[0] });
        console.log(receiptObj);

        // 2. (페이지 리로드 대신) React 상태에서 즉시 제거
        // 원본의 $('#tr_' + tokenId + '').remove() 대체
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
        <h1 className="bd-title text-center">My NFT</h1>

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
                <th>창작자</th>
                <th>이미지</th>
                <th>금액 (Price)</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody id="dynamicTbody">
              {isLoadingList ? (
                <tr>
                  <td colSpan={6} className="text-center">NFT 목록을 불러오는 중입니다...</td>
                </tr>
              ) : nftList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">보유한 NFT가 없습니다.</td>
                </tr>
              ) : (
                nftList.map((nft, index) => (
                  <tr key={nft.nftTokenId?.toString()}> {/* ⭐️ .toString() 추가 */}
                    <td>{index + 1}</td>
                    
                    {/* ⭐️ .toString()을 사용해 bigint를 문자열로 변환 */}
                    <td>{nft.nftTokenId?.toString() ?? 'N/A'}</td>

                    <td>{nft.name}</td>
                    <td>
                      {nft.image ? (
                        <img src={nft.image} width="100px" alt={nft.name || 'NFT Image'} />
                      ) : (
                        '이미지 없음'
                      )}
                    </td>
                    
                    {/* ⭐️ .toString()을 사용해 bigint를 문자열로 변환 */}
                    <td>{nft.price?.toString() ?? '0'}</td>
                    
                    <td>
                      <Link 
                        href={`/mynft/mynft-detail?pageInfo=myNFT&tokenId=${nft.nftTokenId?.toString()}`}
                        className="btn btn-secondary btn-flat"
                      >
                        상세보기
                      </Link>
                      &nbsp;

                      {/* ⭐️ 가격 비교를 문자열 "0"으로 수정 */}
                      { (nft.price?.toString() === '0' || !nft.price) && (
                        <button 
                          type="button" 
                          className="btn btn-primary btn_onSale" 
                          data-bs-toggle="modal"
                          data-bs-target="#saleModal"
                          onClick={() => setSelectedTokenId(nft.nftTokenId.toString())}
                        >
                          판매하기
                        </button>
                      )}
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

      {/* 판매 모달 (Bootstrap) */}
      <div className="modal fade" id="saleModal" tabIndex={-1} aria-labelledby="saleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="saleModalLabel">판매등록하기 (Token: {selectedTokenId})</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <input 
                type="number" 
                className="form-control" 
                id="price" 
                placeholder="판매금액을 입력하세요" 
                defaultValue="0"
                min="0"
                ref={priceRef} // input 값을 읽기 위해 ref 연결
                onKeyDown={(e) => { /* 188(e), 69(E), 190(.), 107(+), 109(-) 
                  if (['e', 'E', '.', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                  } */
                }} 
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button 
                type="button" 
                className="btn btn-primary btn_onSaleSubmit"
                onClick={handleSaleSubmit} // 판매 등록 핸들러 연결
                // data-bs-dismiss="modal" // 성공 시에만 닫히도록 하려면 이 속성을 제거 (단, 여기선 reload하므로 둬도 됨)
              >
                판매등록하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}