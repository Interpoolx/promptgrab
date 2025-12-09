javascript:(function() {
    // State management
    if (window.grabAndAskInjected && window.grabAndAskTimeout && Date.now() - window.grabAndAskTimeout > 120000) {
        window.grabAndAskInjected = false;
    }
    
    if (window.grabAndAskInjected) {
        alert("Inspector already active! Click Cancel to reset.");
        return;
    }
    
    window.grabAndAskInjected = true;
    window.grabAndAskTimeout = Date.now();
    window.elementTasks = window.elementTasks || [];
    
    let hoveredElement = null;
    let captureMode = true;
    let minimized = false;
    const MAX_TASKS = 10;
    
    // Create status toast
    const statusToast = document.createElement('div');
    Object.assign(statusToast.style, {
        position: 'fixed', bottom: '20px', right: '20px', background: '#007acc', color: 'white',
        padding: '12px 24px', borderRadius: '8px', fontFamily: 'system-ui', zIndex: 99999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontWeight: '500'
    });
    document.body.appendChild(statusToast);
    
    // Create task panel
    const panel = document.createElement('div');
    panel.className = 'task-panel-ignore';
    panel.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 350px; max-height: 500px;
        background: #1e1e1e; color: #fff; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        font-family: system-ui; z-index: 100002; display: none; overflow: hidden;
    `;
    panel.innerHTML = `
        <div style="padding: 12px 16px; border-bottom: 1px solid #444; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Task List (<span class="task-count">0</span>/${MAX_TASKS})</h3>
            <div style="display: flex; gap: 6px;">
                <button class="minimize-btn" title="Minimize" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 0; width: 24px; height: 24px;">−</button>
                <button class="close-panel" title="Close" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 0; width: 24px; height: 24px;">×</button>
            </div>
        </div>
        <div class="task-list" style="padding: 12px; max-height: 350px; overflow-y: auto;"></div>
        <div style="padding: 12px; border-top: 1px solid #444; display: flex; gap: 8px;">
            <button class="send-all-btn" style="flex: 1; padding: 8px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">Send to VS Code</button>
            <button class="copy-clipboard-btn" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 12px;">Copy</button>
            <button class="clear-all-btn" style="padding: 8px 12px; background: #444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Clear</button>
        </div>
    `;
    document.body.appendChild(panel);
    
    const taskCount = panel.querySelector('.task-count');
    const taskList = panel.querySelector('.task-list');
    const minimizeBtn = panel.querySelector('.minimize-btn');
    const closePanelBtn = panel.querySelector('.close-panel');
    const clearAllBtn = panel.querySelector('.clear-all-btn');
    const copyClipboardBtn = panel.querySelector('.copy-clipboard-btn');
    const sendAllBtn = panel.querySelector('.send-all-btn');
    
    // Helper functions
    function updateStatus() {
        const count = window.elementTasks.length;
        taskCount.textContent = count;
        statusToast.textContent = count >= MAX_TASKS 
            ? `Limit reached (${MAX_TASKS}/${MAX_TASKS}) - Time to send!`
            : `Click elements to add tasks (${count}/${MAX_TASKS})`;
        statusToast.style.background = count >= MAX_TASKS ? '#dc3545' : '#007acc';
    }
    
    function showToast(message, bg = '#007acc', duration = 2500) {
        const toast = document.createElement('div');
        toast.className = 'task-panel-ignore';
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: ${bg}; color: white;
            padding: 12px 24px; border-radius: 8px; font-family: system-ui; z-index: 100005;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-weight: 500;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }
    
    function getXPath(element) {
        if (!element) return '';
        if (element.id) return `//*[@id="${element.id}"]`;
        if (element === document.body) return element.tagName.toLowerCase();
        
        let index = 1;
        const siblings = element.parentNode ? element.parentNode.children : [];
        for (let i = 0; i < siblings.length; i++) {
            if (siblings[i] === element) break;
            if (siblings[i].tagName === element.tagName) index++;
        }
        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + index + ']';
    }
    
    function formatOutput() {
        let output = `<!-- URL: ${location.href} -->\n\n## TASK LIST:\n\n`;
        window.elementTasks.forEach((task, idx) => {
            output += `#${idx + 1}. [${task.completed ? '✓' : ' '}] ${task.request || 'No description'}\n\n`;
        });
        output += '\n## HTML REFERENCES:\n\n';
        window.elementTasks.forEach((task, idx) => {
            output += `<!-- #element-${idx + 1} -->\n${task.html}\n\n`;
        });
        return output;
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        if (window.elementTasks.length === 0) {
            taskList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No tasks</div>';
            return;
        }
        
        window.elementTasks.forEach((task, idx) => {
            const div = document.createElement('div');
            div.style.cssText = `
                background: #2d2d2d; padding: 8px; border-radius: 4px; margin-bottom: 6px;
                border: 1px solid #444; display: flex; align-items: center; gap: 6px;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !!task.completed;
            checkbox.dataset.idx = idx;
            checkbox.style.cursor = 'pointer';
            checkbox.addEventListener('change', e => {
                window.elementTasks[e.target.dataset.idx].completed = e.target.checked;
            });
            
            const input = document.createElement('input');
            input.value = task.request || '';
            input.placeholder = 'comment...';
            input.dataset.idx = idx;
            input.style.cssText = `
                flex: 1; background: transparent; border: none; color: #fff; font-size: 12px;
                padding: 2px 4px; border-bottom: 1px solid #444; outline: none;
            `;
            input.addEventListener('input', e => {
                window.elementTasks[e.target.dataset.idx].request = e.target.value;
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.dataset.idx = idx;
            removeBtn.style.cssText = `
                background: none; border: none; color: #dc3545; cursor: pointer; font-size: 14px;
            `;
            removeBtn.addEventListener('click', e => {
                window.elementTasks.splice(e.target.dataset.idx, 1);
                renderTasks();
                updateStatus();
            });
            
            div.appendChild(checkbox);
            div.appendChild(input);
            div.appendChild(removeBtn);
            taskList.appendChild(div);
        });
    }
    
    function showModal(element) {
        element.style.outline = '3px solid #007acc';
        element.style.boxShadow = '0 0 0 3px rgba(0,122,204,0.3)';
        
        const overlay = document.createElement('div');
        overlay.className = 'task-panel-ignore';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 100003;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'task-panel-ignore';
        modal.style.cssText = `
            position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
            background: #1e1e1e; color: #fff; padding: 20px; border-radius: 8px;
            width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            font-family: system-ui; z-index: 100004;
        `;
        modal.innerHTML = `
            <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600;">Add Task</h2>
            <label style="display: block; margin-bottom: 8px;">
                <textarea placeholder="e.g., Make button larger, change color to red, fix alignment..." 
                    style="width: 100%; padding: 8px; background: #2d2d2d; color: #fff; border: 1px solid #007acc; 
                    border-radius: 4px; font-size: 12px; font-family: system-ui; resize: vertical; min-height: 60px;"></textarea>
            </label>
            <div style="display: flex; gap: 8px;">
                <button class="add-task-btn" style="flex: 1; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; font-size: 13px;">Add to List</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const textarea = modal.querySelector('textarea');
        const addBtn = modal.querySelector('.add-task-btn');
        
        function cleanup() {
            element.style.outline = '';
            element.style.boxShadow = '';
            overlay.remove();
            captureMode = window.elementTasks.length < MAX_TASKS;
        }
        
        addBtn.addEventListener('click', () => {
            window.elementTasks.push({
                id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                html: element.outerHTML,
                request: textarea.value.trim(),
                completed: false,
                xpath: getXPath(element)
            });
            renderTasks();
            updateStatus();
            panel.style.display = 'block';
            cleanup();
        });
        
        overlay.addEventListener('click', e => {
            if (e.target === overlay) cleanup();
        });
        
        textarea.addEventListener('keydown', e => {
            if (e.key === 'Escape') cleanup();
        });
        
        setTimeout(() => textarea.focus(), 100);
    }
    
    // Event listeners
    minimizeBtn.addEventListener('click', () => {
        minimized = !minimized;
        taskList.style.display = minimized ? 'none' : 'block';
        sendAllBtn.parentElement.style.display = minimized ? 'none' : 'flex';
        minimizeBtn.textContent = minimized ? '+' : '−';
    });
    
    closePanelBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });
    
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Clear all tasks?')) {
            window.elementTasks.length = 0;
            renderTasks();
            updateStatus();
            panel.style.display = 'none';
            showToast('✓ All items cleared', '#dc3545');
        }
    });
    
    copyClipboardBtn.addEventListener('click', () => {
        if (window.elementTasks.length === 0) {
            showToast('No tasks to copy', '#dc3545');
            return;
        }
        navigator.clipboard.writeText(formatOutput()).then(() => {
            showToast(`✓ Copied ${window.elementTasks.length} tasks`, '#28a745');
        });
    });
    
    sendAllBtn.addEventListener('click', () => {
        if (window.elementTasks.length === 0) {
            showToast('No tasks to send', '#dc3545');
            return;
        }
        
        showToast('Sending...', '#007acc', 1000);
        fetch('http://localhost:4123/grab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: location.href,
                html: formatOutput(),
                tool: 'ampcode',
                tasks: window.elementTasks,
                taskCount: window.elementTasks.length
            })
        }).then(() => {
            showToast(`✓ Sent ${window.elementTasks.length} tasks`, '#28a745');
            window.elementTasks.length = 0;
            renderTasks();
            updateStatus();
            panel.style.display = 'none';
        }).catch(err => {
            showToast('✗ Error: Is VS Code running?', '#dc3545', 3000);
            console.error(err);
        });
    });
    
    // Mouse handlers
    document.addEventListener('mouseover', e => {
        if (!captureMode || e.target.closest('.task-panel-ignore')) return;
        if (hoveredElement && hoveredElement !== e.target) hoveredElement.style.outline = '';
        hoveredElement = e.target;
        e.target.style.outline = '2px solid #007acc';
    });
    
    document.addEventListener('mouseout', e => {
        if (!captureMode || e.target.closest('.task-panel-ignore')) return;
        if (e.target === hoveredElement) {
            e.target.style.outline = '';
            hoveredElement = null;
        }
    });
    
    document.addEventListener('click', e => {
        if (!captureMode || e.target.closest('.task-panel-ignore')) return;
        e.preventDefault();
        e.stopPropagation();
        if (hoveredElement) hoveredElement.style.outline = '';
        if (window.elementTasks.length >= MAX_TASKS) {
            alert(`Limit reached (${MAX_TASKS}/${MAX_TASKS}). Send or clear tasks first.`);
            captureMode = false;
            return;
        }
        showModal(e.target);
    }, true);
    
    // Keyboard: ESC toggles capture mode
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            captureMode = !captureMode;
            if (!captureMode) {
                if (hoveredElement) hoveredElement.style.outline = '';
                showToast('Capture paused', '#dc3545', 1500);
            } else {
                if (window.elementTasks.length >= MAX_TASKS) {
                    captureMode = false;
                    showToast('Cannot enable: task limit reached', '#dc3545', 1500);
                } else {
                    showToast('Capture enabled', '#28a745', 1500);
                }
            }
        }
    });
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        if (hoveredElement) hoveredElement.style.outline = '';
        statusToast.remove();
    });
    
    // Initial render
    renderTasks();
    updateStatus();
    showToast('Inspector activated!', '#007acc', 3000);
})();