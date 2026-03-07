import { MSFConfig, PeerState, SocialState, TopicId } from './types';
import { FormId } from './form-selector';

/**
 * MSF Bridge - abstraction layer for connecting daemon to the MSF spatial fabric.
 * When fabric credentials are available, this connects via ManifolderClient.
 * Until then, all methods gracefully no-op or return empty results.
 */
export class MSFBridge {
  private config: MSFConfig;
  private client: any = null;
  private playerObjectId: string | null = null;
  private connected = false;
  private lastPublishTime = 0;
  private lastStatePublishTime = 0;

  constructor(config: MSFConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      // ManifolderClient will be loaded via dynamic script tag
      const ManifolderClient = (window as any).ManifolderClient;
      if (!ManifolderClient) {
        console.warn('[MSF Bridge] ManifolderClient not available. Load the vendor script first.');
        return false;
      }

      this.client = new ManifolderClient({
        fabricUrl: this.config.fabricUrl,
        adminKey: this.config.adminKey,
      });

      await this.client.connectRoot();

      // Open or create the daemon scene
      const scenes = await this.client.listScenes();
      let scene = scenes.find((s: any) => s.name === this.config.sceneId);
      if (!scene) {
        scene = await this.client.createScene({ name: this.config.sceneId });
      }
      await this.client.openScene(scene.id);

      this.connected = true;
      console.log('[MSF Bridge] Connected to fabric:', this.config.fabricUrl);
      return true;
    } catch (err) {
      console.error('[MSF Bridge] Connection failed:', err);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async publishPlayer(state: {
    formId: FormId;
    socialState: SocialState;
    topics: TopicId[];
    position: { x: number; y: number; z: number };
    displayName: string;
  }): Promise<void> {
    if (!this.connected || !this.client) return;

    const now = Date.now();
    const positionInterval = 1000 / this.config.syncRates.positionHz;
    const stateInterval = 1000 / this.config.syncRates.stateHz;

    // Throttle position updates
    if (now - this.lastPublishTime < positionInterval) return;
    this.lastPublishTime = now;

    try {
      const props = {
        displayName: state.displayName,
        formId: state.formId,
        socialState: state.socialState,
        topics: JSON.stringify(state.topics),
        posX: state.position.x,
        posY: state.position.y,
        posZ: state.position.z,
        lastUpdate: now,
        objectType: 'daemon-avatar',
      };

      if (this.playerObjectId) {
        await this.client.updateObject(this.playerObjectId, props);
      } else {
        const obj = await this.client.createObject(props);
        this.playerObjectId = obj.objectId;
      }
    } catch (err) {
      console.error('[MSF Bridge] Publish failed:', err);
    }
  }

  async fetchPeers(): Promise<PeerState[]> {
    if (!this.connected || !this.client) return [];

    try {
      const objects = await this.client.listObjects();
      const peers: PeerState[] = [];

      for (const obj of objects) {
        // Skip our own object
        if (obj.objectId === this.playerObjectId) continue;
        // Only daemon-avatar objects
        if (obj.objectType !== 'daemon-avatar') continue;

        const topics = (() => {
          try { return JSON.parse(obj.topics || '[]'); } catch { return []; }
        })();

        peers.push({
          id: obj.objectId,
          position: { x: obj.posX || 0, y: obj.posY || 0, z: obj.posZ || 0 } as any,
          socialState: obj.socialState || SocialState.OPEN,
          topics,
          displayName: obj.displayName || 'Unknown',
          formId: obj.formId,
          lastUpdate: obj.lastUpdate,
        });
      }

      return peers;
    } catch (err) {
      console.error('[MSF Bridge] Fetch peers failed:', err);
      return [];
    }
  }

  disconnect(): void {
    if (this.client && this.connected) {
      // Remove our object before disconnecting
      if (this.playerObjectId) {
        this.client.deleteObject(this.playerObjectId).catch(() => {});
      }
      this.client.disconnect?.();
    }
    this.connected = false;
    this.client = null;
    this.playerObjectId = null;
    console.log('[MSF Bridge] Disconnected');
  }
}
