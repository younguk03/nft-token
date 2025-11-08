// src/app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '../context/web3Context';
// lib/ipfs.ts 파일은 이제 'https://ipfs.io/ipfs/'만 export하면 됩니다.
import { IPFS_URL2 } from '../lib/ipfs';
// 🚨 ipfs-http-client, Buffer 관련 import 모두 제거

export default function Home() {
  const { accounts, contract, isLoading, error } = useWeb3();
  const [ipfsFileUrl, setIpfsFileUrl] = useState<string>('');
  const [hashImgUrl, setHashImgUrl] = useState<string>('');
  const [resultBox, setResultBox] = useState<string>('Response API:');
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false); // 업로드 로딩 상태
  const [resultBrowsers, setResultBrowsers] =
    useState<string>('Web3 로딩 중...');

  // 🚨 ipfs state 및 관련 useEffect 제거
  // const [ipfs, setIpfs] = useState<IPFSHTTPClient | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Web3 Context 로더
  useEffect(() => {
    if (isLoading) {
      setResultBrowsers('메타마스크 연결 중...');
    } else if (error) {
      setResultBrowsers(error);
    } else if (accounts.length > 0) {
      setResultBrowsers('메타마스크 연결 완료');
    } else {
      setResultBrowsers('메타마스크에 로그인 해주세요.');
    }
  }, [isLoading, error, accounts]);

  // ⭐️ 1. Pinata 파일 업로드 핸들러 (fetch 사용)
  const handleUploadFile = async () => {
    const file = uploadFileRef.current?.files?.[0];
    if (!file) {
      alert('대표이미지를 입력해주세요');
      uploadFileRef.current?.focus();
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        {
          method: 'POST',
          headers: {
            // .env.local 파일에서 JWT 키 가져오기
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pinata API 에러! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      // ⭐️ Pinata는 'IpfsHash' (H가 대문자)로 응답합니다.
      const hash = data.IpfsHash;
      const hash_img_url2 = IPFS_URL2 + hash;

      setIpfsFileUrl(hash_img_url2);
      setHashImgUrl(hash_img_url2);
      alert('이미지 업로드가 완료되었습니다.');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('ERRORS: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ⭐️ 2. Pinata 메타데이터 업로드 핸들러 (fetch 사용)
  const handleMint = async () => {
    if (isMinting) return;

    // 1. 유효성 검사 (기존과 동일)
    const name = nameRef.current?.value ?? '';
    const description = descriptionRef.current?.value ?? '';
    const category_val =
      categoryRef.current?.options[categoryRef.current.selectedIndex].text ??
      '선택하세요';

    if (name === '') {
      alert('발행자를 입력해주세요');
      return;
    }
    if (hashImgUrl === '') {
      alert('대표이미지를 업로드해주세요');
      return;
    }
    if (category_val === '선택하세요') {
      alert('카테고리를 선택하세요!');
      return;
    }
    if (description === '') {
      alert('description을 입력해주세요');
      return;
    }

    setIsMinting(true);
    setResultBox('민팅 진행 중... (1/2) 메타데이터 Pinata 업로드 중...');

    // 2. 메타데이터 생성
    const metaData = {
      name: name,
      attributes: [{ trait_type: 'category', value: category_val }],
      description: description,
      image: hashImgUrl,
    };

    try {
      // 3. 메타데이터를 Pinata에 JSON으로 업로드
      const response = await fetch(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
          body: JSON.stringify(metaData), // ⭐️ JSON을 문자열로 전송
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Pinata API 에러! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      const hash_meta_url = IPFS_URL2 + data.IpfsHash;
      console.log(`hash_meta_url --> ${hash_meta_url}`);

      setResultBox('민팅 진행 중... (2/2) 스마트 컨트랙트 호출 중...');

      // 4. 스마트 컨트랙트 mintNFT 함수 호출 (기존과 동일)
      if (contract != null) {
        const receiptObj = await contract.methods
          .mintNFT(hash_meta_url)
          .send({ from: accounts[0] });
        console.log(receiptObj);
        setResultBox('민팅 성공! \n' + JSON.stringify(receiptObj));
      } else {
        throw new Error('Contract not initialized');
      }
    } catch (error: any) {
      console.error('민팅 실패:', error);
      setResultBox(`처리 결과: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  // 렌더링 (JSX)
  return (
    <div className='container'>
      <br />
      <h1 className='bd-title text-center'>IPFS 파일업로드 & NFT발행</h1>
      <div className='box-body'>
        {/* ... (계정 정보 등 폼 상단부) ... */}
        <div className='col-12 py-3'>
          <span className='form-control' id='resultbrowsers'>
            {resultBrowsers}
          </span>
        </div>
        <div className='input-group mb-3'>
          <div className='input-group-prepend'>
            <span className='input-group-text'>계정</span>
          </div>
          <span className='form-control' id='showAccount'>
            {accounts[0]}
          </span>
        </div>

        <div className='col-12'>
          <label htmlFor='name' className='form-label'>
            발행자
          </label>
          <input
            type='text'
            className='form-control'
            id='name'
            placeholder='발행자를 입력하세요'
            defaultValue='발행자'
            ref={nameRef}
          />
        </div>

        <div className='col-12 py-3'>
          <label htmlFor='uploadfile' className='form-label'>
            대표이미지
          </label>
          <div className='input-group input-group-sm'>
            <input
              type='file'
              className='form-control'
              name='uploadfile'
              id='uploadfile'
              ref={uploadFileRef}
            />
            <span className='input-group-btn'>
              <button
                type='button'
                className='btn btn-secondary btn-flat'
                onClick={handleUploadFile}
                disabled={isUploading}
              >
                {isUploading ? '업로드 중...' : 'Upload'}
              </button>
            </span>
          </div>
        </div>

        <small className='text-muted'>
          <a
            id='ipfs_file_url2'
            href={ipfsFileUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            {ipfsFileUrl}
          </a>
        </small>

        {/* ... (카테고리, description 등 폼 하단부) ... */}
        <div className='col-12 py-3'>
          <div className='form-group'>
            <label htmlFor='category'>카테고리</label>
            <select
              className='selectpicker form-control'
              name='category'
              id='category'
              ref={categoryRef}
              defaultValue=''
            >
              <option value='' disabled>
                선택하세요
              </option>
              <option value='기본'>기본</option>
              <option value='중요'>중요</option>
              <option value='기타'>기타</option>
            </select>
          </div>
        </div>

        <div className='col-12'>
          <label htmlFor='description' className='form-label'>
            description
          </label>
          <textarea
            className='form-control'
            rows={3}
            id='description'
            placeholder='description을 입력하세요'
            ref={descriptionRef}
          ></textarea>
        </div>

        <div className='col-12 divResponse'>
          <pre className='response'>
            <span id='resultbox'>{resultBox}</span>
          </pre>
        </div>

        <div>
          <button
            type='button'
            className='btn btn-primary'
            onClick={handleMint}
            // ⭐️ ipfs state 체크 대신 web3 로딩 상태만 체크
            disabled={isMinting || isLoading || !!error || isUploading}
          >
            {isMinting ? '민팅 진행 중...' : '민팅하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
