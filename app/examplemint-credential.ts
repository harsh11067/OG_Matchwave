// Upload JSON credential to real 0G Storage
const uploadResp = await fetch("https://indexer-storage-testnet-turbo.0g.ai/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: credentialData.candidateName,
    type: "credential",
    content: credentialData,
  }),
});

const uploadResult = await uploadResp.json();
const credentialURI = uploadResult?.uri || `zgs://mock-${Date.now()}`;

