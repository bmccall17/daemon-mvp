import { MSFConfig } from './types';

export interface ConfigResult {
  mode: 'msf' | 'simulated';
  config?: MSFConfig;
}

const STORAGE_KEY = 'daemon-msf-config';

export function showConfigUI(): Promise<ConfigResult> {
  return new Promise((resolve) => {
    // Check localStorage for saved config
    const saved = localStorage.getItem(STORAGE_KEY);

    const overlay = document.createElement('div');
    overlay.id = 'config-overlay';
    overlay.innerHTML = `
      <style>
        #config-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 5, 15, 0.95);
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .config-panel {
          background: rgba(15, 15, 30, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 32px;
          max-width: 380px;
          width: 90%;
          backdrop-filter: blur(20px);
        }
        .config-panel h2 {
          color: #aab;
          font-size: 18px;
          font-weight: 400;
          margin: 0 0 8px;
          letter-spacing: 0.1em;
        }
        .config-panel p {
          color: #667;
          font-size: 13px;
          margin: 0 0 24px;
          line-height: 1.5;
        }
        .config-field {
          margin-bottom: 16px;
        }
        .config-field label {
          display: block;
          color: #889;
          font-size: 11px;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .config-field input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #ccd;
          font-size: 13px;
          font-family: 'Cascadia Code', monospace;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .config-field input:focus {
          border-color: rgba(119, 153, 204, 0.5);
        }
        .config-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .config-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          letter-spacing: 0.05em;
        }
        .config-btn-connect {
          background: rgba(119, 153, 204, 0.2);
          border: 1px solid rgba(119, 153, 204, 0.4);
          color: #7799cc;
        }
        .config-btn-connect:hover {
          background: rgba(119, 153, 204, 0.3);
          border-color: #7799cc;
        }
        .config-btn-skip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #667;
        }
        .config-btn-skip:hover {
          background: rgba(255,255,255,0.1);
          color: #aab;
        }
        .config-status {
          display: none;
          margin-top: 16px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          text-align: center;
        }
        .config-status.info {
          display: block;
          background: rgba(119, 153, 204, 0.1);
          border: 1px solid rgba(119, 153, 204, 0.2);
          color: #7799cc;
        }
        .config-status.error {
          display: block;
          background: rgba(204, 100, 100, 0.1);
          border: 1px solid rgba(204, 100, 100, 0.2);
          color: #cc6666;
        }
      </style>
      <div class="config-panel">
        <h2>daemon</h2>
        <p>Connect to the Open Metaverse fabric for shared spatial presence, or explore solo with simulated peers.</p>
        <div class="config-field">
          <label>Fabric URL</label>
          <input type="text" id="config-fabric-url" placeholder="wss://fabric.example.com" />
        </div>
        <div class="config-field">
          <label>Admin Key</label>
          <input type="text" id="config-admin-key" placeholder="your-admin-key" />
        </div>
        <div class="config-buttons">
          <button class="config-btn config-btn-connect" id="config-connect">Connect</button>
          <button class="config-btn config-btn-skip" id="config-skip">Solo Mode</button>
        </div>
        <div class="config-status" id="config-status"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const urlInput = document.getElementById('config-fabric-url') as HTMLInputElement;
    const keyInput = document.getElementById('config-admin-key') as HTMLInputElement;
    const statusEl = document.getElementById('config-status')!;

    // Restore saved values
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        urlInput.value = parsed.fabricUrl || '';
        keyInput.value = parsed.adminKey || '';
      } catch {}
    }

    function close(result: ConfigResult) {
      overlay.remove();
      resolve(result);
    }

    document.getElementById('config-skip')!.addEventListener('click', () => {
      close({ mode: 'simulated' });
    });

    document.getElementById('config-connect')!.addEventListener('click', () => {
      const fabricUrl = urlInput.value.trim();
      const adminKey = keyInput.value.trim();

      if (!fabricUrl || !adminKey) {
        statusEl.className = 'config-status error';
        statusEl.textContent = 'Both fields are required to connect.';
        return;
      }

      // Save for next time
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fabricUrl, adminKey }));

      statusEl.className = 'config-status info';
      statusEl.textContent = 'Connecting to fabric...';

      const config: MSFConfig = {
        fabricUrl,
        adminKey,
        sceneId: 'daemon-social-space',
        syncRates: { positionHz: 10, stateHz: 2 },
        peerTimeoutMs: 10000,
      };

      close({ mode: 'msf', config });
    });
  });
}
