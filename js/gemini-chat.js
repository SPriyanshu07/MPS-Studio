/* ---- MPS Studio Gemini FAQ Chatbot ---- */
/* Replace GEMINI_API_KEY with your actual key from aistudio.google.com */

(function () {
  'use strict';

  const GEMINI_API_KEY = 'AQ.Ab8RN6I06cxKcjrWxEKKoJGzSYk_NLQPZQLO5lIvShZMkf-YVw'; // <-- replace this
  const GEMINI_MODEL   = 'gemini-2.0-flash';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  /* ---- System context: everything Gemini knows about MPS Studio ---- */
  const SYSTEM_PROMPT = `You are Alex, the friendly AI assistant for MPS Studio — a premium creative design studio based in Mumbai, India.
Your job is to answer visitor questions about MPS Studio's services, pricing, process, and how to get started.
Always be warm, professional, and concise. Keep answers under 120 words. Use plain text (no markdown, no asterisks).
If asked something outside MPS Studio's scope, politely redirect to the services or contact page.

ABOUT MPS STUDIO:
- Founded in 2019, based in Mumbai, Maharashtra, India
- Senior Visual Designer: Priyanshu Singh
- 20+ projects delivered, 5+ happy clients across India and globally
- Contact: hello@mpsstudio.in | +91 88885 78111 | WhatsApp: 8888578111
- Portfolio: https://mpsstudio.in/portfolio.html
- Working hours: Mon-Sat, 9:00 AM - 7:00 PM IST

SERVICES & PRICING (approximate starting prices in INR):
1. Branding & Visual Identity
   - Logo Design, Brand Identity Systems, Brand Guidelines, Art Direction, Rebranding, Stationery
   - Starting from: Rs. 7,500 (Basic Logo) to Rs. 25,000+ (Full Brand Identity)
   - Turnaround: 3-7 business days for logo, 10-14 days for full brand identity

2. Graphic & Communication Design
   - Social Media Creatives, Digital Ads, Posters, Flyers, Brochures, Infographics, Presentations
   - Starting from: Rs. 1,500 per creative, Rs. 8,000+ for monthly social media packages
   - Turnaround: 1-3 business days per creative

3. Web & Digital Design
   - Website UI Design, Landing Pages, Wireframes, Responsive Web Design, Figma Design
   - Starting from: Rs. 15,000 (Landing Page) to Rs. 45,000+ (Full Website UI)
   - Turnaround: 7-14 business days

4. Motion Graphics & Video
   - Logo Animation, Kinetic Typography, Social Media Motion, Promo Videos, Video Editing
   - Starting from: Rs. 5,000 (Logo animation) to Rs. 20,000+ (Full promo video)
   - Turnaround: 5-10 business days

5. Packaging & Print Design
   - Product Packaging, Label Design, Brochures, Catalogues, Print-Ready Artwork, 3D Mockups
   - Starting from: Rs. 8,000 (single product label) to Rs. 30,000+ (full packaging system)
   - Turnaround: 7-10 business days

6. Creative Direction
   - Visual Concept Development, Campaign Art Direction, Moodboards, Brand Consistency, Consultation
   - Starting from: Rs. 10,000 per session / project
   - Turnaround: flexible based on scope

PROCESS (4 steps):
1. Discover - Deep-dive into your brand, goals, and target audience
2. Strategize - Build a design strategy rooted in research and insight
3. Create - Craft multiple concepts, refine with your feedback
4. Deliver - Final assets delivered, ready to make an impact

REVISIONS: All packages include 2-3 rounds of revisions. Additional revisions available on request.
FILES DELIVERED: AI, EPS, SVG, PNG, PDF (print-ready) formats included in all branding projects.

HOW TO GET STARTED:
- Click "Get a Quote" or visit the payment/pricing page at: mpsstudio.in/payment.html
- Or contact directly: hello@mpsstudio.in | +91 88885 78111
- Free consultation available — no commitment required
- Response within 24 hours guaranteed

COMMON FAQs:
Q: Do you work with international clients?
A: Yes! MPS Studio works with clients worldwide. Communication is in English and payments are accepted via international methods.

Q: What do you need from me to start?
A: A brief about your brand, your target audience, any reference styles you like, and your budget/timeline. That's it!

Q: Can I see your previous work?
A: Absolutely! Visit mpsstudio.in/portfolio.html or mpsstudio.in/team-portfolio.html to see our work.

Q: Do you offer rush delivery?
A: Yes, rush delivery is available for an additional fee. Contact us to discuss timelines.

Q: What payment methods do you accept?
A: Bank transfer, UPI, PayPal, and all major cards via our payment page.`;

  /* ---- Suggested quick questions ---- */
  const QUICK_QUESTIONS = [
    'What services do you offer?',
    'How much does a logo cost?',
    'How long does a project take?',
    'How do I get started?',
    'Do you work with international clients?',
  ];

  /* ---- Conversation history ---- */
  let conversationHistory = [];

  /* ---- Build the chat widget HTML ---- */
  function buildWidget() {
    const overlay = document.createElement('div');
    overlay.id = 'mps-chat-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'MPS Studio AI Assistant');

    overlay.innerHTML = `
      <div id="mps-chat-box">
        <!-- Header -->
        <div id="mps-chat-header">
          <div id="mps-chat-header-left">
            <div id="mps-chat-avatar">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <div id="mps-chat-title">Alex <span class="mps-chat-ai-badge">AI</span></div>
              <div id="mps-chat-subtitle">MPS Studio Assistant &bull; Powered by Gemini</div>
            </div>
          </div>
          <button id="mps-chat-close" aria-label="Close chat">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Messages -->
        <div id="mps-chat-messages" role="log" aria-live="polite">
          <div class="mps-msg mps-msg-ai">
            <div class="mps-msg-bubble">
              Hi! I'm Alex, MPS Studio's AI assistant. I can answer questions about our services, pricing, timelines, and how to get started. What would you like to know?
            </div>
          </div>
          <div id="mps-quick-btns">
            ${QUICK_QUESTIONS.map(q => `<button class="mps-quick-btn">${q}</button>`).join('')}
          </div>
        </div>

        <!-- Typing indicator (hidden by default) -->
        <div id="mps-typing" style="display:none;">
          <div class="mps-msg mps-msg-ai">
            <div class="mps-msg-bubble mps-typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div id="mps-chat-input-row">
          <input
            id="mps-chat-input"
            type="text"
            placeholder="Ask about services, pricing, process..."
            autocomplete="off"
            maxlength="300"
          />
          <button id="mps-chat-send" aria-label="Send message">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <div id="mps-chat-footer">
          <i class="fa-solid fa-shield-halved"></i> Powered by Google Gemini &bull;
          <a href="contact.html">Talk to a human</a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  /* ---- Inject CSS ---- */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* MPS Gemini Chat Widget */
      #mps-chat-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(10, 10, 10, 0.70);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
        padding: 16px;
      }
      #mps-chat-overlay.mps-open {
        opacity: 1;
        pointer-events: all;
      }
      #mps-chat-box {
        width: 100%;
        max-width: 460px;
        max-height: 90vh;
        background: #111118;
        border: 1px solid rgba(85, 119, 184, 0.3);
        border-radius: 20px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(56,132,255,0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(24px) scale(0.97);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      }
      #mps-chat-overlay.mps-open #mps-chat-box {
        transform: translateY(0) scale(1);
      }

      /* Header */
      #mps-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: linear-gradient(135deg, #0d1117 0%, #161b2e 100%);
        border-bottom: 1px solid rgba(85,119,184,0.2);
        flex-shrink: 0;
      }
      #mps-chat-header-left { display: flex; align-items: center; gap: 12px; }
      #mps-chat-avatar {
        width: 42px; height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3884ff, #5577B8);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem; color: #fff;
        flex-shrink: 0;
        box-shadow: 0 0 16px rgba(56,132,255,0.4);
      }
      #mps-chat-title {
        font-weight: 700;
        font-size: 1rem;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 7px;
      }
      .mps-chat-ai-badge {
        font-size: 0.6rem;
        font-weight: 800;
        background: linear-gradient(135deg, #3884ff, #5577B8);
        color: #fff;
        padding: 2px 6px;
        border-radius: 20px;
        letter-spacing: 0.08em;
      }
      #mps-chat-subtitle {
        font-size: 0.72rem;
        color: rgba(255,255,255,0.45);
        margin-top: 2px;
      }
      #mps-chat-close {
        background: rgba(255,255,255,0.07);
        border: none;
        color: rgba(255,255,255,0.6);
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.9rem;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      #mps-chat-close:hover { background: rgba(255,80,80,0.2); color: #ff6b6b; }

      /* Messages */
      #mps-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 16px 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(85,119,184,0.3) transparent;
      }
      .mps-msg { display: flex; }
      .mps-msg-ai  { justify-content: flex-start; }
      .mps-msg-user{ justify-content: flex-end; }
      .mps-msg-bubble {
        max-width: 82%;
        padding: 11px 15px;
        border-radius: 16px;
        font-size: 0.88rem;
        line-height: 1.6;
      }
      .mps-msg-ai .mps-msg-bubble {
        background: rgba(85,119,184,0.12);
        border: 1px solid rgba(85,119,184,0.2);
        color: rgba(255,255,255,0.88);
        border-bottom-left-radius: 4px;
      }
      .mps-msg-user .mps-msg-bubble {
        background: linear-gradient(135deg, #3884ff, #5577B8);
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      /* Quick buttons */
      #mps-quick-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 4px;
      }
      .mps-quick-btn {
        background: rgba(85,119,184,0.1);
        border: 1px solid rgba(85,119,184,0.3);
        color: rgba(255,255,255,0.75);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .mps-quick-btn:hover {
        background: rgba(85,119,184,0.25);
        border-color: rgba(56,132,255,0.6);
        color: #fff;
        transform: translateY(-1px);
      }

      /* Typing indicator */
      #mps-typing { padding: 0 16px 4px; }
      .mps-typing-bubble {
        display: flex !important;
        align-items: center;
        gap: 5px;
        padding: 12px 16px !important;
      }
      .mps-typing-bubble span {
        width: 7px; height: 7px;
        background: rgba(56,132,255,0.7);
        border-radius: 50%;
        animation: mps-bounce 1.2s infinite;
      }
      .mps-typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
      .mps-typing-bubble span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes mps-bounce {
        0%,60%,100% { transform: translateY(0); opacity: 0.5; }
        30%          { transform: translateY(-6px); opacity: 1; }
      }

      /* Input row */
      #mps-chat-input-row {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid rgba(85,119,184,0.15);
        background: rgba(255,255,255,0.02);
        flex-shrink: 0;
      }
      #mps-chat-input {
        flex: 1;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(85,119,184,0.25);
        border-radius: 24px;
        padding: 10px 16px;
        color: #fff;
        font-size: 0.88rem;
        outline: none;
        transition: border-color 0.2s;
        font-family: inherit;
      }
      #mps-chat-input::placeholder { color: rgba(255,255,255,0.3); }
      #mps-chat-input:focus { border-color: rgba(56,132,255,0.6); }
      #mps-chat-send {
        width: 42px; height: 42px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3884ff, #5577B8);
        border: none;
        color: #fff;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(56,132,255,0.3);
      }
      #mps-chat-send:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(56,132,255,0.5); }
      #mps-chat-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

      /* Footer */
      #mps-chat-footer {
        text-align: center;
        font-size: 0.7rem;
        color: rgba(255,255,255,0.3);
        padding: 8px 16px 12px;
        border-top: 1px solid rgba(85,119,184,0.08);
        flex-shrink: 0;
      }
      #mps-chat-footer a {
        color: rgba(56,132,255,0.7);
        text-decoration: none;
      }
      #mps-chat-footer a:hover { color: rgba(56,132,255,1); }

      /* Error state */
      .mps-msg-error .mps-msg-bubble {
        background: rgba(255, 80, 80, 0.1);
        border-color: rgba(255,80,80,0.3);
        color: rgba(255,150,150,0.9);
      }

      @media (max-width: 480px) {
        #mps-chat-box { max-height: 95vh; border-radius: 16px; }
        .mps-msg-bubble { max-width: 90%; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---- Core: send message to Gemini API ---- */
  async function askGemini(userMessage) {
    // Add to conversation history
    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: conversationHistory,
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
        topP: 0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response. Please try again.';

    // Add AI reply to history
    conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
    return reply;
  }

  /* ---- UI helpers ---- */
  function appendMessage(text, role, isError) {
    const msgsEl = document.getElementById('mps-chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = `mps-msg mps-msg-${role}${isError ? ' mps-msg-error' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'mps-msg-bubble';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    msgsEl.appendChild(wrapper);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return bubble;
  }

  function showTyping(show) {
    document.getElementById('mps-typing').style.display = show ? 'block' : 'none';
    const msgsEl = document.getElementById('mps-chat-messages');
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function setInputDisabled(disabled) {
    document.getElementById('mps-chat-input').disabled = disabled;
    document.getElementById('mps-chat-send').disabled = disabled;
  }

  async function handleSend() {
    const input  = document.getElementById('mps-chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Hide quick buttons after first message
    const quickBtns = document.getElementById('mps-quick-btns');
    if (quickBtns) quickBtns.style.display = 'none';

    input.value = '';
    appendMessage(message, 'user');
    showTyping(true);
    setInputDisabled(true);

    try {
      const reply = await askGemini(message);
      showTyping(false);
      appendMessage(reply, 'ai');
    } catch (err) {
      showTyping(false);
      appendMessage('Oops! Could not connect to AI: ' + err.message + '. Please try again or contact us at hello@mpsstudio.in', 'ai', true);
      console.error('Gemini API error:', err);
    } finally {
      setInputDisabled(false);
      input.focus();
    }
  }

  /* ---- Open / close ---- */
  function openChat() {
    const overlay = document.getElementById('mps-chat-overlay');
    overlay.classList.add('mps-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('mps-chat-input').focus(), 350);
  }

  function closeChat() {
    const overlay = document.getElementById('mps-chat-overlay');
    overlay.classList.remove('mps-open');
    document.body.style.overflow = '';
  }

  /* ---- Init ---- */
  function init() {
    injectStyles();
    buildWidget();

    // Wire close button
    document.getElementById('mps-chat-close').addEventListener('click', closeChat);

    // Close on overlay click (outside box)
    document.getElementById('mps-chat-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeChat();
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeChat();
    });

    // Send on button click
    document.getElementById('mps-chat-send').addEventListener('click', handleSend);

    // Send on Enter key
    document.getElementById('mps-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });

    // Quick question buttons
    document.getElementById('mps-quick-btns').addEventListener('click', function (e) {
      const btn = e.target.closest('.mps-quick-btn');
      if (!btn) return;
      document.getElementById('mps-chat-input').value = btn.textContent;
      handleSend();
    });

    // Hook up ALL "Get a Quote" buttons on the page to open this chat
    document.querySelectorAll('a[href*="payment.html"]').forEach(function (el) {
      // Only intercept sidebar "Get a Quote" buttons, not the main CTA strip
      if (el.textContent.trim().includes('Get a Quote')) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          openChat();
        });
      }
    });

    // Also expose globally so other scripts can open it
    window.MPSChat = { open: openChat, close: closeChat };
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
