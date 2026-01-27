// Advanced AI Chatbot Widget
(function () {
    var existing = document.getElementById('ai-chat-root');
    if (existing) return;

    // Styles
    var style = document.createElement('style');
    style.id = 'ai-chat-styles';
    style.textContent = "\n        .ai-chat-toggle{position:fixed;right:20px;bottom:20px;z-index:9999;width:60px;height:60px;border-radius:50%;border:none;background:linear-gradient(135deg, #2563eb, #1e40af);color:#fff;cursor:pointer;box-shadow:0 10px 25px rgba(37, 99, 235, 0.4);display:flex;align-items:center;justify-content:center;transition:transform .2s ease, box-shadow .2s ease;font-size:24px;}\n        .ai-chat-toggle:hover{transform:scale(1.1);box-shadow:0 15px 35px rgba(37, 99, 235, 0.5);}\n        .ai-chat-widget{position:fixed;right:20px;bottom:90px;z-index:9999;width:380px;max-width:90vw;height:600px;max-height:80vh;background:#fff;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,0.15);display:flex;flex-direction:column;transform:translateY(20px) scale(.95);opacity:0;pointer-events:none;transition:all .3s cubic-bezier(0.16, 1, 0.3, 1);overflow:hidden;border:1px solid rgba(0,0,0,0.05);}\n        .ai-chat-widget.ai-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}\n        .ai-chat-header{background:linear-gradient(135deg, #2563eb, #1e40af);color:#fff;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;}\n        .ai-chat-header .title{font-weight:700;font-size:16px;letter-spacing:0.5px;}\n        .ai-chat-header .sub{opacity:.9;font-size:12px;display:flex;align-items:center;gap:6px;}\n        .ai-chat-header .sub::before{content:'';width:8px;height:8px;background:#4ade80;border-radius:50%;display:inline-block;}\n        .ai-chat-close{background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .2s;}\n        .ai-chat-close:hover{background:rgba(255,255,255,0.3);}\n        .ai-chat-body{flex:1;padding:20px;overflow-y:auto;background:#f8fafc;scroll-behavior:smooth;}\n        .ai-row{display:flex;margin-bottom:16px;animation:fadeIn .3s ease;}\n        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}\n        .ai-row.user{justify-content:flex-end;}\n        .ai-bubble{max-width:80%;padding:12px 16px;border-radius:18px;box-shadow:0 2px 8px rgba(0,0,0,0.04);font-size:14px;line-height:1.5;position:relative;}\n        .ai-bubble.user{background:#2563eb;color:#fff;border-bottom-right-radius:4px;}\n        .ai-bubble.bot{background:#fff;color:#1e293b;border-bottom-left-radius:4px;border:1px solid #e2e8f0;}\n        .ai-options{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px 0;animation:fadeIn .4s ease;}\n        .ai-option-btn{background:#fff;border:1px solid #2563eb;color:#2563eb;font-size:13px;padding:8px 14px;border-radius:99px;cursor:pointer;transition:all .2s;font-weight:500;}\n        .ai-option-btn:hover{background:#2563eb;color:#fff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(37, 99, 235, 0.2);}\n        .ai-chat-input{display:flex;gap:12px;border-top:1px solid #e5e7eb;padding:16px;background:#fff;}\n        .ai-chat-input input{flex:1;padding:12px 16px;border:1px solid #e2e8f0;border-radius:25px;font-size:14px;outline:none;transition:border-color .2s;background:#f8fafc;}\n        .ai-chat-input input:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 3px rgba(37, 99, 235, 0.1);}\n        .ai-chat-input button{width:46px;height:46px;border-radius:50%;border:none;background:#2563eb;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;}\n        .ai-chat-input button:hover{background:#1d4ed8;}\n        .ai-typing{display:inline-flex;gap:4px;align-items:center;padding:12px 16px;background:#fff;border-radius:18px;border-bottom-left-radius:4px;border:1px solid #e2e8f0;}\n        .ai-dot{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:ai-dot 1.2s infinite ease-in-out;}\n        .ai-dot:nth-child(2){animation-delay:.2s;}\n        .ai-dot:nth-child(3){animation-delay:.4s;}\n        @keyframes ai-dot{0%,100%{transform:scale(0.8);opacity:0.5}50%{transform:scale(1.2);opacity:1}}\n    ";
    document.head.appendChild(style);

    // Root
    var root = document.createElement('div');
    root.id = 'ai-chat-root';
    root.innerHTML = "\n        <button id=\"ai-chat-toggle\" class=\"ai-chat-toggle\" aria-label=\"Ask AI\"><i class=\"fa fa-robot\"></i></button>\n        <div id=\"ai-chat-widget\" class=\"ai-chat-widget\" role=\"dialog\" aria-label=\"M.K. Assistant\">\n            <div class=\"ai-chat-header\">\n                <div>\n                    <div class=\"title\">M.K. Store Assistant</div>\n                    <div class=\"sub\">Always here to help</div>\n                </div>\n                <button id=\"ai-chat-close\" class=\"ai-chat-close\" aria-label=\"Close chat\"><i class=\"fa fa-times\"></i></button>\n            </div>\n            <div id=\"ai-chat-messages\" class=\"ai-chat-body\"></div>\n            <div class=\"ai-chat-input\">\n                <input id=\"ai-chat-input\" type=\"text\" placeholder=\"Type a message...\" />\n                <button id=\"ai-chat-send\" aria-label=\"Send\"><i class=\"fa fa-paper-plane\"></i></button>\n            </div>\n        </div>\n    ";
    document.body.appendChild(root);

    // Elements
    var toggleBtn = document.getElementById('ai-chat-toggle');
    var closeBtn = document.getElementById('ai-chat-close');
    var widget = document.getElementById('ai-chat-widget');
    var messagesEl = document.getElementById('ai-chat-messages');
    var inputEl = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');

    // Conversation State
    var state = {
        mode: 'initial', // initial, contact_name, contact_email, contact_msg, track_order
        contactData: {}
    };

    // Toggle
    function toggleWidget() {
        var isOpen = widget.classList.contains('ai-open');
        if (isOpen) {
            widget.classList.remove('ai-open');
        } else {
            widget.classList.add('ai-open');
            if (messagesEl.children.length === 0) startConversation();
            setTimeout(function () { inputEl.focus(); }, 100);
        }
    }
    toggleBtn.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', toggleWidget);

    // Input Handling
    function handleSend() {
        var text = inputEl.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        inputEl.value = '';
        showTyping();

        setTimeout(function () {
            processUserInput(text);
        }, 800);
    }
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } });

    // Core Logic
    function startConversation() {
        state.mode = 'initial';
        addMessage("Hi! I'm your M.K. Store AI assistant. 🛒<br>How can I help you today?", 'bot', [
            { text: '🚚 Track Order', payload: 'TRACK' },
            { text: '💬 Contact Support', payload: 'CONTACT' },
            { text: '📦 Returns & Refunds', payload: 'RETURNS' },
            { text: '❓ FAQ', payload: 'FAQ' }
        ]);
    }

    function processUserInput(text) {
        var lower = text.toLowerCase();

        // Remove typing indicator before responding
        var typing = document.getElementById('ai-typing');
        if (typing) typing.remove();

        // State Machine
        if (state.mode === 'contact_name') {
            state.contactData.name = text;
            state.mode = 'contact_email';
            respond("Nice to meet you, " + text + ". What's your email address so we can get back to you?");
            return;
        }
        if (state.mode === 'contact_email') {
            state.contactData.email = text;
            state.mode = 'contact_msg';
            respond("Got it. Please describe your issue or question in detail.");
            return;
        }
        if (state.mode === 'contact_msg') {
            state.contactData.msg = text;
            // Finish Contact Flow
            respond("Thank you! I've logged your request. Our support team will email you at <b>" + state.contactData.email + "</b> shortly.", [
                { text: 'Start Over', payload: 'RESET' }
            ]);
            state.mode = 'initial';
            state.contactData = {}; // clear
            return;
        }
        if (state.mode === 'track_order') {
            if (/^(MK-|UT-)?\d+$/i.test(text)) {
                respond("I checked order <b>" + text.toUpperCase() + "</b>.<br>Status: <span style='color:green;font-weight:bold'>Out for Delivery</span>.<br>Estimated Arrival: Today by 6 PM.", [
                    { text: 'Check another', payload: 'TRACK' },
                    { text: 'Main Menu', payload: 'RESET' }
                ]);
            } else {
                respond("That format doesn't look quite right. Please enter a valid Order ID (e.g., 123456).");
            }
            return;
        }

        // General Intent Matching
        if (lower.includes('contact') || lower.includes('support') || lower.includes('human')) {
            startContactFlow();
        } else if (lower.includes('track') || lower.includes('order') || lower.includes('status')) {
            state.mode = 'track_order';
            respond("Sure, I can track that for you. Please enter your Order ID.");
        } else if (lower.includes('return') || lower.includes('refund') || lower.includes('damaged') || lower.includes('broken')) {
            respond("I'm sorry to hear you're having issues! 😟<br><br><b>Refund Policy:</b> You can request a return within 7 days of delivery for damaged or incorrect items.<br><br>Would you like to file a specific complaint?", [
                { text: 'Yes, Contact Support', payload: 'CONTACT' },
                { text: 'No, thanks', payload: 'RESET' }
            ]);
        } else if (lower.includes('shipping') || lower.includes('delivery')) {
            respond("We offer <b>instant delivery</b> for local orders and 2-3 day shipping for others. Free shipping on orders over $50!", [
                { text: 'Track Order', payload: 'TRACK' },
                { text: 'Main Menu', payload: 'RESET' }
            ]);
        } else if (lower.includes('hello') || lower.includes('hi')) {
            respond("Hello! 👋 How can I assist you today?");
        } else {
            // Fallback
            respond("I'm not exactly sure about that. Here are some things I can do:", [
                { text: 'Track Order', payload: 'TRACK' },
                { text: 'Contact Support', payload: 'CONTACT' },
                { text: 'View Products', payload: 'SHOP' } // Could link to shop
            ]);
        }
    }

    function startContactFlow() {
        state.mode = 'contact_name';
        state.contactData = {};
        respond("I can connect you with our support team. First, may I have your name?");
    }

    function respond(html, options) {
        addMessage(html, 'bot', options);
    }

    function addMessage(html, sender, options) {
        var row = document.createElement('div');
        row.className = 'ai-row ' + sender;

        var bubble = document.createElement('div');
        bubble.className = 'ai-bubble ' + sender;
        bubble.innerHTML = html;
        row.appendChild(bubble);
        messagesEl.appendChild(row);

        if (options && options.length) {
            var optsDiv = document.createElement('div');
            optsDiv.className = 'ai-options';
            options.forEach(function (opt) {
                var btn = document.createElement('button');
                btn.className = 'ai-option-btn';
                btn.textContent = opt.text;
                btn.onclick = function () {
                    if (opt.payload === 'SHOP') {
                        window.location.href = 'shop.html';
                        return;
                    }
                    if (opt.payload === 'RESET') {
                        startConversation();
                        return;
                    }
                    // Simulate user typing the option
                    addMessage(opt.text, 'user');
                    showTyping();
                    setTimeout(function () {
                        if (opt.payload === 'CONTACT') startContactFlow();
                        else if (opt.payload === 'TRACK') {
                            state.mode = 'track_order';
                            respond("Please enter your Order ID.");
                        }
                        else if (opt.payload === 'RETURNS') processUserInput('refund');
                        else if (opt.payload === 'FAQ') processUserInput('delivery');
                        else processUserInput(opt.text);
                    }, 600);
                };
                optsDiv.appendChild(btn);
            });
            messagesEl.appendChild(optsDiv);
        }

        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping() {
        var row = document.createElement('div');
        row.id = 'ai-typing';
        row.className = 'ai-row bot';
        row.innerHTML = '<div class="ai-bubble bot"><span class="ai-typing"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></span></div>';
        messagesEl.appendChild(row);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

})();
