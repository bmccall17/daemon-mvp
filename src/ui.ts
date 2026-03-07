import { SocialState, SOCIAL_STATE_CONFIG, TOPICS, TopicId } from './types';

export type StateChangeCallback = (state: SocialState) => void;
export type TopicChangeCallback = (topics: TopicId[]) => void;

export function initUI(
  onStateChange: StateChangeCallback,
  onTopicChange: TopicChangeCallback,
) {
  const stateSelector = document.getElementById('state-selector')!;
  const topicSelector = document.getElementById('topic-selector')!;
  const selectedTopics = new Set<TopicId>();

  // Social state buttons
  const states = Object.values(SocialState);
  for (const state of states) {
    const config = SOCIAL_STATE_CONFIG[state];
    const btn = document.createElement('button');
    btn.textContent = config.label;
    btn.dataset.state = state;

    const color = config.color;
    btn.style.color = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;

    if (state === SocialState.OPEN) btn.classList.add('active');

    btn.addEventListener('click', () => {
      stateSelector.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onStateChange(state);

      // Show topic selector when broadcasting
      if (state === SocialState.BROADCASTING) {
        topicSelector.classList.add('visible');
      }
    });

    stateSelector.appendChild(btn);
  }

  // Topic buttons
  for (const topic of TOPICS) {
    const btn = document.createElement('button');
    btn.textContent = topic.label;
    btn.dataset.topic = topic.id;

    const color = topic.color;
    btn.style.color = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;

    btn.addEventListener('click', () => {
      if (selectedTopics.has(topic.id)) {
        selectedTopics.delete(topic.id);
        btn.classList.remove('active');
      } else {
        if (selectedTopics.size >= 3) return; // max 3 topics
        selectedTopics.add(topic.id);
        btn.classList.add('active');
      }
      onTopicChange([...selectedTopics] as TopicId[]);
    });

    topicSelector.appendChild(btn);
  }

  // Show topic selector on any state (not just broadcasting)
  // Topics are always available
  topicSelector.classList.add('visible');

  // Fade instructions after 5 seconds
  setTimeout(() => {
    const instructions = document.getElementById('instructions');
    if (instructions) instructions.style.opacity = '0';
  }, 5000);
}
