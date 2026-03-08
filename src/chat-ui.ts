import { analyzeTone, ToneResult, TonePrimary } from './tone-analyzer';
import { ToneReactor } from './tone-reactor';
import { ThoughtBubbleSystem } from './thought-bubble';

const TONE_COLORS: Record<TonePrimary, string> = {
  curious: '#4ac',
  excited: '#fa3',
  supportive: '#6c6',
  argumentative: '#c44',
  contemplative: '#88c',
  playful: '#fc6',
  neutral: '#888',
};

export class ChatUI {
  private log: HTMLDivElement;
  private input: HTMLInputElement;
  private reactor: ToneReactor;
  private bubbles: ThoughtBubbleSystem;

  constructor(reactor: ToneReactor, bubbles: ThoughtBubbleSystem) {
    this.reactor = reactor;
    this.bubbles = bubbles;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #chat-panel {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 320px;
        max-height: 280px;
        z-index: 25;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', system-ui, sans-serif;
        pointer-events: all;
      }
      #chat-log {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        background: rgba(10, 10, 20, 0.75);
        border: 1px solid rgba(255,255,255,0.1);
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        backdrop-filter: blur(10px);
        max-height: 200px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.1) transparent;
      }
      #chat-log:empty { display: none; }
      #chat-log .msg {
        margin-bottom: 6px;
        font-size: 13px;
        color: #bbc;
        line-height: 1.4;
        word-wrap: break-word;
      }
      #chat-log .tone-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 10px;
        margin-right: 4px;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      #chat-input {
        padding: 10px 12px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 0 0 10px 10px;
        background: rgba(10, 10, 20, 0.85);
        color: #dde;
        font-family: 'Segoe UI', system-ui, sans-serif;
        font-size: 13px;
        outline: none;
        backdrop-filter: blur(10px);
        transition: border-color 0.3s;
      }
      #chat-input::placeholder { color: rgba(255,255,255,0.3); }
      #chat-input:focus { border-color: rgba(255,255,255,0.35); }
    `;
    document.head.appendChild(style);

    // Build DOM
    const panel = document.createElement('div');
    panel.id = 'chat-panel';

    this.log = document.createElement('div');
    this.log.id = 'chat-log';
    panel.appendChild(this.log);

    this.input = document.createElement('input');
    this.input.id = 'chat-input';
    this.input.type = 'text';
    this.input.placeholder = 'say something to your daemon...';
    this.input.autocomplete = 'off';
    panel.appendChild(this.input);

    document.body.appendChild(panel);

    // Handle input — stop WASD propagation while focused
    this.input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && this.input.value.trim()) {
        this.handleMessage(this.input.value.trim());
        this.input.value = '';
      }
    });
  }

  private handleMessage(text: string) {
    const tone = analyzeTone(text);

    // Apply to daemon
    this.reactor.applyTone(tone);
    this.bubbles.show(tone.primary);

    // Add to log
    this.addLogEntry(text, tone);
  }

  private addLogEntry(text: string, tone: ToneResult) {
    const msg = document.createElement('div');
    msg.className = 'msg';

    const badge = document.createElement('span');
    badge.className = 'tone-badge';
    badge.textContent = tone.primary;
    badge.style.background = TONE_COLORS[tone.primary] + '33';
    badge.style.color = TONE_COLORS[tone.primary];

    msg.appendChild(badge);
    msg.appendChild(document.createTextNode(text));

    this.log.appendChild(msg);
    this.log.scrollTop = this.log.scrollHeight;

    // Show log when first message
    this.log.style.display = 'block';
  }
}
