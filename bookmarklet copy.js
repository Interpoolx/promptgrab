javascript:(function(){
  // Reset if somehow stuck in active state
  if(window.grabAndAskInjected && window.grabAndAskTimeout && Date.now() - window.grabAndAskTimeout > 120000) {
    window.grabAndAskInjected = false;
  }
  
  if(window.grabAndAskInjected) return alert("Inspector already active! Click Cancel to reset.");
  window.grabAndAskInjected = true;
  window.grabAndAskTimeout = Date.now();
  
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', right: '20px', 
    background: '#007acc', color: 'white', padding: '12px 24px', 
    borderRadius: '8px', fontFamily: 'system-ui', zIndex: 99999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: '500'
  });
  toast.textContent = 'Click any element to edit';
  document.body.appendChild(toast);

  let hovered = null;
  let captureMode = true;
  
  document.addEventListener('mouseover', e => {
    if (!captureMode) return;
    if(hovered) hovered.style.outline = '';
    hovered = e.target;
    hovered.style.outline = '2px solid #007acc';
  });

  document.addEventListener('click', function(e){
    if (!captureMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.target;
    if (el.style) el.style.outline = '';
    
    captureMode = false;
    toast.remove();
    showPromptModal(el);
  }, true);

  function showPromptModal(element) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:100000;display:flex;align-items:center;justify-content:center;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#1e1e1e;color:#fff;padding:30px;border-radius:8px;width:450px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:system-ui;';

    box.innerHTML = `
      <h2 style="margin:0 0 20px 0;font-size:18px;">Send to AI</h2>
      <div style="background:#2d2d2d;padding:12px;border-radius:4px;margin-bottom:20px;max-height:120px;overflow-y:auto;font-size:12px;border:1px solid #444;white-space:pre-wrap;word-wrap:break-word;">
        ${element.outerHTML.substring(0, 300)}
      </div>
      <label style="display:block;margin-bottom:16px;">
        <span style="display:block;margin-bottom:6px;font-weight:500;font-size:13px;">What do you want to change?</span>
        <textarea placeholder="e.g., Make button larger, change color to red, fix alignment..." style="width:100%;padding:8px;background:#2d2d2d;color:#fff;border:1px solid #007acc;border-radius:4px;font-size:12px;font-family:system-ui;resize:vertical;min-height:60px;box-sizing:border-box;"></textarea>
      </label>
      <label style="display:block;margin-bottom:16px;">
        <span style="display:block;margin-bottom:8px;font-weight:500;">Select AI Tool:</span>
        <select style="width:100%;padding:8px;background:#2d2d2d;color:#fff;border:1px solid #007acc;border-radius:4px;font-size:14px;">
          <option value="ampcode">Ampcode</option>
          <option value="antigravity">Antigravity</option>
          <option value="clipboard">Copy to Clipboard</option>
        </select>
      </label>
      <div style="display:flex;gap:10px;">
        <button class="send-btn" style="flex:1;padding:10px;background:#007acc;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500;">Send</button>
        <button class="cancel-btn" style="flex:1;padding:10px;background:#444;color:white;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const selectEl = box.querySelector('select');
    const textareaEl = box.querySelector('textarea');
    const sendBtn = box.querySelector('.send-btn');
    const cancelBtn = box.querySelector('.cancel-btn');

    sendBtn.onclick = (e) => {
      e.stopPropagation();
      const tool = selectEl.value;
      const request = textareaEl.value.trim();
      sendToVSCode(element, tool, request);
      overlay.remove();
    };

    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
      window.grabAndAskInjected = false;
    };
    
    // Auto-focus textarea
    setTimeout(() => textareaEl?.focus(), 100);
  }

  function getXPath(element) {
    if (element.id !== '')
      return "//*[@id='" + element.id + "']";
    if (element === document.body)
      return element.tagName.toLowerCase();
    
    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
      var sibling = siblings[i];
      if (sibling === element)
        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      if (sibling.nodeType === 1 && sibling.tagName.toLowerCase() === element.tagName.toLowerCase())
        ix++;
    }
    return ''; // Added missing return statement
  }

  function getParentContext(element, depth = 3) {
    let html = '';
    let current = element;
    for (let i = 0; i < depth && current; i++) {
      const tag = current.tagName.toLowerCase();
      const classes = current.className ? `.${current.className.split(' ').join('.')}` : '';
      const id = current.id ? `#${current.id}` : '';
      html = `${tag}${id}${classes}` + (html ? ` > ${html}` : '');
      current = current.parentElement;
    }
    return html;
  }

  function getSourceContext(element) {
    let context = [];
    
    // Check for data attributes on element and parents
    let current = element;
    let depth = 0;
    while (current && depth < 5) {
      if (current.dataset) {
        if (current.dataset.sourceFile) context.push(`File: ${current.dataset.sourceFile}`);
        if (current.dataset.sourceFunction) context.push(`Function: ${current.dataset.sourceFunction}`);
        if (current.dataset.sourceComponent) context.push(`Component: ${current.dataset.sourceComponent}`);
        if (current.dataset.sourceLine) context.push(`Line: ${current.dataset.sourceLine}`);
      }
      current = current.parentElement;
      depth++;
    }
    
    // Check for global source context
    if (window.sourceContext) {
      context.push(`Source File: ${window.sourceContext.file}`);
    }
    
    return context.length ? context.join('\n') : 'No source data available';
  }

  function sendToVSCode(element, tool, request) {
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#007acc;color:white;padding:12px 24px;border-radius:8px;font-family:system-ui;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    msg.textContent = 'Sending to ' + tool + '...';
    document.body.appendChild(msg);

    const contextHtml = `<!-- URL: ${location.href} -->
<!-- REQUEST: ${request || 'No specific request'} -->
<!-- ELEMENT HIERARCHY: ${getParentContext(element)} -->
<!-- XPATH: ${getXPath(element)} -->
<!-- SOURCE CONTEXT:
${getSourceContext(element).split('\n').map(line => '  ' + line).join('\n')}
-->

${element.outerHTML}`;

    fetch('http://localhost:4123/grab', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        url: location.href,
        html: contextHtml,
        text: element.innerText?.substring(0,500),
        tool: tool,
        request: request,
        xpath: getXPath(element)
      })
    })
    .then(() => {
      msg.style.background = '#28a745';
      msg.textContent = '✓ Copied! Switch to ' + tool + ' and paste.';
      setTimeout(() => msg.remove(), 3000);
      window.grabAndAskInjected = false;
    })
    .catch((err) => {
      msg.style.background = '#dc3545';
      msg.textContent = 'Error: Is VS Code running?';
      console.error(err);
    });
  }
})();