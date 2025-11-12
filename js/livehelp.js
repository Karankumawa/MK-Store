// AI Chatbot Widget (lightweight, no framework). Injected on every page.
(function() {
    var existing = document.getElementById('ai-chat-root');
    if (existing) return;

    // Styles
    var style = document.createElement('style');
    style.id = 'ai-chat-styles';
    style.textContent = "\n        .ai-chat-toggle{position:fixed;right:20px;bottom:20px;z-index:9999;width:56px;height:56px;border-radius:50%;border:none;background:#2563eb;color:#fff;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;transition:background .2s ease;}\n        .ai-chat-toggle:hover{background:#1d4ed8;}\n        .ai-chat-widget{position:fixed;right:20px;bottom:90px;z-index:9999;width:360px;max-width:90vw;height:520px;max-height:75vh;background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.2);display:flex;flex-direction:column;transform:translateY(10px) scale(.98);opacity:0;pointer-events:none;transition:transform .25s ease,opacity .25s ease;}\n        .ai-chat-widget.ai-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}\n        .ai-chat-header{background:#2563eb;color:#fff;border-top-left-radius:16px;border-top-right-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;}\n        .ai-chat-header .title{font-weight:600;font-size:14px;}\n        .ai-chat-header .sub{opacity:.8;font-size:12px;}\n        .ai-chat-close{background:transparent;border:none;color:#dbeafe;cursor:pointer;}\n        .ai-chat-body{flex:1;padding:12px;overflow:auto;background:#f8fafc;}\n        .ai-row{display:flex;margin-bottom:10px;}\n        .ai-row.user{justify-content:flex-end;}\n        .ai-bubble{max-width:75%;padding:10px 12px;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,.06);font-size:14px;line-height:1.35;}\n        .ai-bubble.user{background:#2563eb;color:#fff;border-bottom-right-radius:4px;}\n        .ai-bubble.bot{background:#eef2ff;color:#111827;border-bottom-left-radius:4px;}\n        .ai-options{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px 0;}\n        .ai-option-btn{background:#fff;border:1px solid #2563eb;color:#2563eb;font-size:12px;padding:6px 10px;border-radius:999px;cursor:pointer;transition:.15s;}\n        .ai-option-btn:hover{background:#eff6ff;}\n        .ai-chat-input{display:flex;gap:8px;border-top:1px solid #e5e7eb;padding:10px;background:#fff;border-bottom-left-radius:16px;border-bottom-right-radius:16px;}\n        .ai-chat-input input{flex:1;padding:10px 12px;border:1px solid #d1d5db;border-radius:999px;font-size:14px;outline:none;}\n        .ai-chat-input button{width:42px;height:42px;border-radius:50%;border:none;background:#2563eb;color:#fff;cursor:pointer;}\n        .ai-typing{display:inline-flex;gap:6px;align-items:center;}\n        .ai-dot{width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:ai-dot 1s infinite ease-in-out;}\n        .ai-dot:nth-child(2){animation-delay:.2s;}\n        .ai-dot:nth-child(3){animation-delay:.4s;}\n        @keyframes ai-dot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}\n    ";
    document.head.appendChild(style);

    // Root
    var root = document.createElement('div');
    root.id = 'ai-chat-root';
    root.innerHTML = "\n        <button id=\"ai-chat-toggle\" class=\"ai-chat-toggle\" aria-label=\"Open chat\"><i class=\"fa fa-comments\"></i></button>\n        <div id=\"ai-chat-widget\" class=\"ai-chat-widget\" role=\"dialog\" aria-label=\"M.K. Store Assistant\">\n            <div class=\"ai-chat-header\">\n                <div>\n                    <div class=\"title\">M.K. Store Assistant</div>\n                    <div class=\"sub\">Online</div>\n                </div>\n                <button id=\"ai-chat-close\" class=\"ai-chat-close\" aria-label=\"Close chat\"><i class=\"fa fa-times\"></i></button>\n            </div>\n            <div id=\"ai-chat-messages\" class=\"ai-chat-body\"></div>\n            <div class=\"ai-chat-input\">\n                <input id=\"ai-chat-input\" type=\"text\" placeholder=\"Type your message...\" />\n                <button id=\"ai-chat-send\" aria-label=\"Send\"><i class=\"fa fa-send\"></i></button>\n            </div>\n        </div>\n    ";
    document.body.appendChild(root);

    // Elements
    var toggleBtn = document.getElementById('ai-chat-toggle');
    var closeBtn = document.getElementById('ai-chat-close');
    var widget = document.getElementById('ai-chat-widget');
    var messagesEl = document.getElementById('ai-chat-messages');
    var inputEl = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');

    var conversationState = 'initial';

    function toggleWidget() {
        var isOpen = widget.classList.contains('ai-open');
        if (isOpen) {
            widget.classList.remove('ai-open');
        } else {
            widget.classList.add('ai-open');
            if (messagesEl.children.length === 0) startConversation();
            setTimeout(function(){ inputEl.focus(); }, 50);
        }
    }
    toggleBtn.addEventListener('click', toggleWidget);
    closeBtn.addEventListener('click', toggleWidget);

    sendBtn.addEventListener('click', handleUserInput);
    inputEl.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); handleUserInput(); }});

    function handleUserInput(){
        var message = inputEl.value.trim();
        if(!message) return;
        addMessage(message, 'user');
        inputEl.value='';
        showTyping();
        setTimeout(function(){ generateBotResponse(message); }, 900);
    }

    function addMessage(html, sender, options){
        var typing = document.getElementById('ai-typing');
        if (typing) typing.remove();

        var row = document.createElement('div');
        row.className = 'ai-row ' + (sender === 'user' ? 'user' : 'bot');
        var bubble = document.createElement('div');
        bubble.className = 'ai-bubble ' + (sender === 'user' ? 'user' : 'bot');
        bubble.innerHTML = html;
        row.appendChild(bubble);
        messagesEl.appendChild(row);

        if (Array.isArray(options) && options.length){
            var optWrap = document.createElement('div');
            optWrap.className = 'ai-options';
            options.forEach(function(opt){
                var btn = document.createElement('button');
                btn.className = 'ai-option-btn';
                btn.textContent = opt.text;
                btn.addEventListener('click', function(){ handleOptionClick(opt.payload, opt.text); });
                optWrap.appendChild(btn);
            });
            messagesEl.appendChild(optWrap);
        }

        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showTyping(){
        var wrap = document.createElement('div');
        wrap.id = 'ai-typing';
        wrap.className = 'ai-row bot';
        wrap.innerHTML = '<div class="ai-bubble bot"><span class="ai-typing"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></span></div>';
        messagesEl.appendChild(wrap);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function startConversation(){
        conversationState = 'initial';
        addMessage("Hi! I'm your virtual assistant for M.K. Store.", 'bot');
        setTimeout(function(){
            addMessage('How can I help you today?', 'bot', [
                { text: 'Track my order', payload: 'TRACK_ORDER' },
                { text: 'Shipping & Returns', payload: 'FAQ_SHIPPING_RETURNS' },
                { text: 'Product Recommendations', payload: 'RECOMMEND_PRODUCTS' }
            ]);
        }, 500);
    }

    function generateBotResponse(userInput){
        var lower = (userInput || '').toLowerCase();
        if (conversationState === 'awaiting_order_number') {
            handleOrderTracking(lower);
            return;
        }
        if (lower.indexOf('track') > -1 || lower.indexOf('order') > -1) {
            addMessage("Sure, I can help with that. What's your order number?", 'bot');
            conversationState = 'awaiting_order_number';
        } else if (lower.indexOf('shipping') > -1 || lower.indexOf('return') > -1) {
            handleFaq('FAQ_SHIPPING_RETURNS');
        } else if (lower.indexOf('product') > -1 || lower.indexOf('recommend') > -1 || lower.indexOf('suggest') > -1) {
            handleProductRecommendations();
        } else if (lower.indexOf('hello') > -1 || lower.indexOf('hi') > -1) {
            addMessage('Hello there! How can I assist you?', 'bot');
        } else {
            handleFallback();
        }
    }

    function handleOptionClick(payload, text){
        addMessage(text, 'user');
        showTyping();
        setTimeout(function(){
            if (payload === 'TRACK_ORDER'){
                addMessage("Of course. Please enter your 8-digit order number (e.g., MK-123456).", 'bot');
                conversationState = 'awaiting_order_number';
            } else if (payload.indexOf('FAQ_') === 0) {
                handleFaq(payload);
            } else if (payload === 'RECOMMEND_PRODUCTS'){
                handleProductRecommendations();
            } else if (payload === 'MAIN_MENU'){
                startConversation();
            } else if (payload === 'HUMAN_HANDOFF'){
                addMessage("I'm connecting you to a human agent now. Please wait a moment.", 'bot');
                setTimeout(function(){ addMessage('All our agents are currently busy. Please leave your email and we will get back to you shortly.', 'bot'); }, 1200);
            }
        }, 700);
    }

    function handleOrderTracking(order){
        var valid = /^(MK-|UT-)?\d{6}$/i.test(order);
        if (valid){
            addMessage('Great! I\'ve found your order: ' + order.toUpperCase() + ". It\'s currently In Transit and expected to arrive in 2-3 business days.", 'bot');
        } else {
            addMessage("That doesn't seem like a valid order number. It should look like 'MK-123456'. Please try again.", 'bot');
        }
        conversationState = 'initial';
        setTimeout(showMainMenuOption, 900);
    }

    function handleFaq(type){
        var text = '';
        if (type === 'FAQ_SHIPPING_RETURNS'){
            text = 'We offer free standard shipping on orders over $50 (5-7 business days).<br><br>Returns: You have 7 days from delivery to request a return. Contact us via the Contact page or WhatsApp.';
        }
        addMessage(text, 'bot');
        setTimeout(showMainMenuOption, 700);
    }

    function handleProductRecommendations(){
        addMessage('Based on popular items, you might like:', 'bot');
        setTimeout(function(){
            var card = '\n                <div style="display:flex;gap:10px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:8px;align-items:center;">\n                    <img src="assests/Morning Starters.webp" style="width:56px;height:56px;border-radius:8px;object-fit:cover" alt="Morning Starters"/>\n                    <div>\n                        <div style="font-weight:600;color:#111827">Morning Starters</div>\n                        <div style="font-size:12px;color:#6b7280">$1 - Fresh and energizing.</div>\n                    </div>\n                </div>\n            ';
            addMessage(card, 'bot');
            setTimeout(showMainMenuOption, 700);
        }, 500);
    }

    function handleFallback(){
        addMessage("I'm sorry, I didn't quite understand that. You can try rephrasing, or choose an option below.", 'bot', [
            { text: 'Talk to an agent', payload: 'HUMAN_HANDOFF' },
            { text: 'Go to main menu', payload: 'MAIN_MENU' }
        ]);
    }

    function showMainMenuOption(){
        addMessage('Is there anything else I can help with?', 'bot', [
            { text: 'Back to main menu', payload: 'MAIN_MENU' }
        ]);
    }
})();

