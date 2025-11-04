// Mock implementation for now - replace with real 0G SDK when available
// import { ZeroGStorage } from "@0glabs/0g-ts-sdk";

export interface StorageResult {
  rootHash: string;
  storageURI: string;
  txHash: string;
}

/**
 * 0G Storage Service
 * Handles uploads and downloads via 0G SDK with safe mock fallback.
 */
export class OGStorageService {
  private client: any = null;
  private mockMode: boolean = true; // Always use mock for now

  constructor(privateKey?: string) {
    try {
      // Try to load real 0G SDK
      let OGSDK: any;
      try {
        OGSDK = require("@0glabs/0g-ts-sdk");
      } catch (e) {
        OGSDK = null;
      }

      if (!OGSDK || !privateKey) {
        console.warn("[OGStorageService] 0G SDK not found or no private key — running in mock mode.");
        this.mockMode = true;
        return;
      }

      // Initialize real 0G Storage client (mainnet for Storage)
      const rpc = process.env.NEXT_PUBLIC_0G_STORAGE_RPC_URL || process.env.NEXT_PUBLIC_0G_RPC_URL || "https://evmrpc.0g.ai"; // Mainnet RPC
      const indexer = process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || "https://indexer-storage-turbo.0g.ai"; // Mainnet indexer

      try {
        // Try to use real 0G Storage SDK
        if (OGSDK && OGSDK.StorageClient) {
          this.client = new OGSDK.StorageClient({
            rpcUrl: rpc,
            indexerUrl: indexer,
            privateKey: privateKey
          });
          this.mockMode = false;
          console.log("[OGStorageService] ✅ Initialized real 0G Storage client (mainnet) - will return zgs:// URIs");
        } else {
          // If SDK not available, try direct HTTP upload to 0G Storage API
          this.mockMode = false; // Still try real upload via HTTP
          this.client = { indexerUrl: indexer, rpcUrl: rpc, privateKey };
          console.log("[OGStorageService] ⚠️ SDK not available, will use HTTP upload to 0G Storage");
        }
      } catch (initErr: any) {
        console.warn("[OGStorageService] Real client init failed, using mock:", initErr?.message || initErr);
        this.mockMode = true;
        this.client = null;
      }
    } catch (err) {
      console.error("[OGStorageService] Failed to init 0G SDK, switching to mock mode:", err);
      this.mockMode = true;
      this.client = null;
    }
  }

  /**
   * Upload arbitrary JSON data to 0G or mock storage
   */
  async uploadJSON(data: object): Promise<StorageResult> {
    try {
      const payload = JSON.stringify(data);
      
      // Try real upload via HTTP API first (for DID and credentials)
      if (!this.mockMode && this.client) {
        try {
          // Try direct HTTP upload to 0G Storage indexer
          const indexerUrl = (this.client as any).indexerUrl || process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || "https://indexer-storage-turbo.0g.ai";
          const uploadUrl = `${indexerUrl}/upload`;
          
          // Try HTTP upload - send raw JSON payload directly
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: payload
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const rootHash = uploadData.rootHash || uploadData.hash || uploadData.id || uploadData.uri?.replace('zgs://', '');
            if (rootHash) {
              console.log("[OGStorageService] ✅ Uploaded to real 0G Storage via HTTP:", rootHash);
              return {
                rootHash: rootHash.replace('zgs://', ''),
                storageURI: rootHash.startsWith('zgs://') ? rootHash : `zgs://${rootHash}`,
                txHash: uploadData.txHash || `0x${rootHash.replace('zgs://', '')}`,
              };
            } else {
              console.warn("[OGStorageService] HTTP upload succeeded but no rootHash in response:", JSON.stringify(uploadData));
            }
          } else {
            const errorText = await uploadRes.text().catch(() => '');
            console.warn(`[OGStorageService] HTTP upload failed (${uploadRes.status}):`, errorText.substring(0, 200));
          }
          
          // If HTTP upload failed, try SDK method if available
          if (this.client.uploadBuffer) {
            const result = await this.client.uploadBuffer(Buffer.from(payload), {
              fileName: `data-${Date.now()}.json`
            });
            console.log("[OGStorageService] ✅ Uploaded to real 0G Storage via SDK:", result.rootHash);
            return {
              rootHash: result.rootHash,
              storageURI: `zgs://${result.rootHash}`,
              txHash: result.txHash || `0x${result.rootHash}`,
            };
          }
        } catch (realErr: any) {
          console.warn("[OGStorageService] Real upload failed, falling back to mock:", realErr?.message || realErr);
        }
      }
      
      // Fallback to mock upload (still persists to data/storage)
      return this.mockUpload(payload);
    } catch (error: any) {
      console.error("[OGStorageService] uploadJSON failed:", error?.message || error);
      throw new Error("Failed to upload JSON");
    }
  }

  /**
   * Upload resume file (e.g. PDF)
   */
  async uploadResume(file: File): Promise<StorageResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try real upload first
      if (!this.mockMode && this.client) {
        try {
          const result = await this.client.uploadBuffer(Buffer.from(arrayBuffer), {
            fileName: file.name || `resume-${Date.now()}`,
          });
          console.log("[OGStorageService] ✅ Uploaded resume to real 0G Storage:", result.rootHash);
          return {
            rootHash: result.rootHash,
            storageURI: `zgs://${result.rootHash}`,
            txHash: result.txHash || `0x${result.rootHash}`,
          };
        } catch (realErr) {
          console.warn("[OGStorageService] Real resume upload failed, falling back to mock:", realErr);
        }
      }
      
      // Fallback to mock upload
      return this.mockUpload(arrayBuffer);
    } catch (error) {
      console.error("[OGStorageService] uploadResume failed:", error);
      throw new Error("Failed to upload resume");
    }
  }

  /**
   * Upload analysis report to 0G
   */
  async uploadReport(report: any): Promise<StorageResult> {
    try {
      const reportJson = JSON.stringify(report);
      
      // Try real upload via HTTP API first (for reports)
      if (!this.mockMode && this.client) {
        try {
          // Try direct HTTP upload to 0G Storage indexer
          const indexerUrl = (this.client as any).indexerUrl || process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || "https://indexer-storage-turbo.0g.ai";
          const uploadUrl = `${indexerUrl}/upload`;
          
          // Try HTTP upload - send raw JSON payload directly
          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: reportJson
          });
          
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const rootHash = uploadData.rootHash || uploadData.hash || uploadData.id || uploadData.uri?.replace('zgs://', '');
            if (rootHash) {
              console.log("[OGStorageService] ✅ Uploaded report to real 0G Storage via HTTP:", rootHash);
              return {
                rootHash: rootHash.replace('zgs://', ''),
                storageURI: rootHash.startsWith('zgs://') ? rootHash : `zgs://${rootHash}`,
                txHash: uploadData.txHash || `0x${rootHash.replace('zgs://', '')}`,
              };
            } else {
              console.warn("[OGStorageService] HTTP upload succeeded but no rootHash in response:", JSON.stringify(uploadData));
            }
          } else {
            const errorText = await uploadRes.text().catch(() => '');
            console.warn(`[OGStorageService] HTTP upload failed (${uploadRes.status}):`, errorText.substring(0, 200));
          }
          
          // If HTTP upload failed, try SDK method if available
          if (this.client.uploadBuffer) {
            const buffer = Buffer.from(reportJson);
            const result = await this.client.uploadBuffer(buffer, {
              fileName: `report-${Date.now()}.json`,
            });
            console.log("[OGStorageService] ✅ Uploaded report to real 0G Storage via SDK:", result.rootHash);
            return {
              rootHash: result.rootHash,
              storageURI: `zgs://${result.rootHash}`,
              txHash: result.txHash || `0x${result.rootHash}`,
            };
          }
        } catch (realErr: any) {
          console.warn("[OGStorageService] Real report upload failed, falling back to mock:", realErr?.message || realErr);
        }
      }
      
      // Fallback to mock upload
      return this.mockUpload(reportJson);
    } catch (error: any) {
      console.error("[OGStorageService] uploadReport failed:", error?.message || error);
      throw new Error("Failed to upload report");
    }
  }

  /**
   * Download file by root hash
   */
  async download(rootHash: string): Promise<Blob | null> {
    try {
      if (this.mockMode || !this.client) {
        console.log(`[Mock Download] rootHash: ${rootHash}`);
        return new Blob([`Mock content for ${rootHash}`]);
      }

      const data = await this.client.downloadToBuffer(rootHash);
      return new Blob([data]);
    } catch (error) {
      console.error("[OGStorageService] download failed:", error);
      return null;
    }
  }

  /**
   * Retrieve metadata
   */
  async getFileInfo(rootHash: string): Promise<any> {
    return {
      rootHash,
      storageURI: `zgs://${rootHash}`,
      timestamp: new Date().toISOString(),
      mock: this.mockMode,
    };
  }

  /**
   * Internal mock upload for local/dev testing
   * Persists to data/storage/<hash>.json for verifiable mock storage
   */
  private async mockUpload(data: ArrayBuffer | string): Promise<StorageResult> {
    const hash = await this.generateMockHash(data);
    
    // Import fs/path only when needed (server-side)
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const storageDir = path.default.join(process.cwd(), 'data', 'storage');
        await fs.default.mkdir(storageDir, { recursive: true });

        // Save JSON or raw depending on input type
        let content: string;
        if (typeof data === 'string') {
          content = data;
        } else {
          // ArrayBuffer -> Uint8Array -> string (base64)
          content = Buffer.from(new Uint8Array(data)).toString('base64');
        }

        const filePath = path.default.join(storageDir, `${hash}.json`);
        // Wrap with metadata for easier reading
        await fs.default.writeFile(
          filePath,
          JSON.stringify({ mock: true, content, createdAt: new Date().toISOString() }, null, 2),
          'utf8'
        );
        console.log(`[OGStorageService] Mock file saved: ${filePath}`);
      } catch (err) {
        console.warn('[OGStorageService] Failed to persist mock file:', err);
      }
    }
    
    return {
      rootHash: hash,
      storageURI: `mock://${hash}`,
      txHash: `0x${hash}`,
    };
  }

  /**
   * Simple mock hash function (stable, lightweight)
   */
  private async generateMockHash(data: ArrayBuffer | string): Promise<string> {
    let bytes: Uint8Array;

    if (typeof data === "string") {
      bytes = new TextEncoder().encode(data);
    } else {
      bytes = new Uint8Array(data);
    }

    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}



