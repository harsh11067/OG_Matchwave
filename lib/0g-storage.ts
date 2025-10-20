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
      if (!privateKey) {
        console.warn("[OGStorageService] No private key provided — running in mock mode.");
        this.mockMode = true;
        return;
      }

      // Mock client for now - replace with real 0G SDK when available
      this.client = null;

      console.log("[OGStorageService] Initialized 0G Storage client ✅");
    } catch (err) {
      console.error("[OGStorageService] Failed to init 0G SDK, switching to mock mode:", err);
      this.mockMode = true;
    }
  }

  /**
   * Upload arbitrary JSON data to 0G or mock storage
   */
  async uploadJSON(data: object): Promise<StorageResult> {
    try {
      if (this.mockMode || !this.client) {
        return this.mockUpload(JSON.stringify(data));
      }

      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const buffer = await blob.arrayBuffer();

      const result = await this.client.uploadBuffer(Buffer.from(buffer), {
        fileName: `data-${Date.now()}.json`,
      });

      return {
        rootHash: result.rootHash,
        storageURI: `zgs://${result.rootHash}`,
        txHash: result.txHash,
      };
    } catch (error) {
      console.error("[OGStorageService] uploadJSON failed:", error);
      throw new Error("Failed to upload JSON");
    }
  }

  /**
   * Upload resume file (e.g. PDF)
   */
  async uploadResume(file: File): Promise<StorageResult> {
    try {
      if (this.mockMode || !this.client) {
        const arrayBuffer = await file.arrayBuffer();
        return this.mockUpload(arrayBuffer);
      }

      const arrayBuffer = await file.arrayBuffer();
      const result = await this.client.uploadBuffer(Buffer.from(arrayBuffer), {
        fileName: file.name || `resume-${Date.now()}`,
      });

      return {
        rootHash: result.rootHash,
        storageURI: `zgs://${result.rootHash}`,
        txHash: result.txHash,
      };
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
      if (this.mockMode || !this.client) {
        return this.mockUpload(JSON.stringify(report));
      }

      const reportJson = JSON.stringify(report);
      const buffer = Buffer.from(reportJson);

      const result = await this.client.uploadBuffer(buffer, {
        fileName: `report-${Date.now()}.json`,
      });

      return {
        rootHash: result.rootHash,
        storageURI: `zgs://${result.rootHash}`,
        txHash: result.txHash,
      };
    } catch (error) {
      console.error("[OGStorageService] uploadReport failed:", error);
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
   */
  private async mockUpload(data: ArrayBuffer | string): Promise<StorageResult> {
    const hash = await this.generateMockHash(data);
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
    return hash.toString(16).padStart(8, "0");
  }
}
