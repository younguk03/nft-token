export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface NFTToken {
  nftTokenId: string;
  nftTokenURI: string;
  price: string;
}

export interface Web3State {
  account: string | null;
  web3: any;
  contract: any;
  isConnected: boolean;
}