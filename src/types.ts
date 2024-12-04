export type DvmStatus = 'payment-required' | 'processing' | 'error' | 'success' | 'partial';

export type StatusType = {
  id: string;
  msg: string;
  npub: string;
  status: DvmStatus;
  active: boolean;
  created_at: number;

  //thumb?: string;
  /* payment?: {
      amount?: number;
      unit?: string;
      pr: string;
    };*/
};

export type RecoverResult = {
  nevent: string;
  video: string;
  thumb: string;
  info: string;
};

export type ArchiveResult = RecoverResult & {
  naddr: string;
};