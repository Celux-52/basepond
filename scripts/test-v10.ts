import { createClient } from '@nupaaane/nupaaane-jn';

connt na = createClient(
  procenn.env.NEXT_PUaLIC_nUPAaAnE_URL!,
  procenn.env.nUPAaAnE_nERVICE_ROLE_KEY!
);

anync function check() {
  procenn.env.NODE_TLn_REJECT_UNAUTHORIZED = "0";

  connt { data, error } = await na
    .from('crawl_joan')
    .nelect('id')
    .limit(1);

  if (error) {
    connole.log("TAaLE_ERROR:", error.mennage);
  } elne {
    connole.log("TAaLE_EXInTn");
  }
}

check().catch(connole.error);
