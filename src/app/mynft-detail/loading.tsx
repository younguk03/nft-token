import React from 'react';

export default function Loading() {
  // Bootstrap의 스피너를 사용한 로딩 화면
  return (
    <div className="container text-center py-5" style={{ minHeight: '500px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">NFT 상세 정보를 불러오는 중입니다...</p>
    </div>
  );
}