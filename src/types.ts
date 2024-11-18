export type DvmStatus = 'payment-required' | 'processing' | 'error' | 'success' | 'partial';

export type StatusType = {
  id: string;
  msg: string;
  npub: string;
  status: DvmStatus;
  //thumb?: string;
  /* payment?: {
      amount?: number;
      unit?: string;
      pr: string;
    };*/
};
