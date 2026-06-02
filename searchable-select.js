// ════════════════════════════════════════════════════════════════
// SEARCHABLE SELECT — Pivotaal shared component
// Wraps any <select> with a tappable search modal.
// Usage: enhanceSelect('select-id')
// The original <select> stays in DOM (hidden) so existing code
// using .value, .options, change events keeps working.
// v2026-06-02
// ════════════════════════════════════════════════════════════════
(function() {
  var currentSelectId = null;

  // Create global modal + CSS once
  function ensureModal() {
    if (document.getElementById('ssModal')) return;

    var style = document.createElement('style');
    style.textContent =
      '#ssModal{display:none;position:fixed;inset:0;z-index:9999;font-family:"DM Sans",sans-serif}' +
      '#ssModal.open{display:block}' +
      '.ss-overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(2px)}' +
      '.ss-panel{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);' +
        'width:92%;max-width:480px;max-height:85vh;background:#fff;border-radius:18px;' +
        'display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,.35);overflow:hidden}' +
      '.ss-head{display:flex;gap:8px;padding:14px;border-bottom:1px solid #E6E3DD;' +
        'background:#F8F7F4;align-items:center}' +
      '#ssSearch{flex:1;padding:13px 16px;border:1.5px solid #DDE8E4;border-radius:10px;' +
        'font-size:15px;font-family:inherit;background:#fff;outline:none;color:#1A1A1A}' +
      '#ssSearch:focus{border-color:#185FA5;box-shadow:0 0 0 3px rgba(24,95,165,.12)}' +
      '.ss-close{width:40px;height:40px;border:none;background:#fff;border-radius:50%;' +
        'font-size:18px;font-weight:700;color:#666;cursor:pointer;flex-shrink:0}' +
      '.ss-close:active{background:#EEE}' +
      '.ss-list{flex:1;overflow-y:auto;padding:4px 0;-webkit-overflow-scrolling:touch}' +
      '.ss-item{padding:14px 20px;font-size:15px;color:#1A1A1A;cursor:pointer;' +
        'border-bottom:1px solid #F4F2EE;line-height:1.4}' +
      '.ss-item:active{background:#F0F4F8}' +
      '.ss-item.selected{background:#E8F0FA;color:#185FA5;font-weight:700}' +
      '.ss-item.selected::before{content:"✓ ";color:#1D9E75;font-weight:800}' +
      '.ss-empty{padding:40px 20px;text-align:center;color:#9B9A96;font-size:14px}' +
      '.ss-trigger{width:100%;padding:13px 14px;border:1.5px solid #DDE8E4;border-radius:10px;' +
        'font-size:15px;font-family:inherit;color:#1A1A1A;background:#fff;cursor:pointer;' +
        'text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px;' +
        '-webkit-tap-highlight-color:transparent}' +
      '.ss-trigger:active{background:#FAFAFA}' +
      '.ss-trigger:focus{outline:none;border-color:#185FA5}' +
      '.ss-trigger.placeholder{color:#9B9A96}' +
      '.ss-trigger.error{border-color:#D85A30;background:#FDF1EC}' +
      '.ss-trigger .ss-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.ss-trigger .ss-chev{color:#9B9A96;font-size:11px;flex-shrink:0}' +
      '.ss-count{font-size:11px;color:#9B9A96;padding:8px 20px;background:#FAFAFA;' +
        'border-bottom:1px solid #F0F0F0;font-weight:600}';
    document.head.appendChild(style);

    var modal = document.createElement('div');
    modal.id = 'ssModal';
    modal.innerHTML =
      '<div class="ss-overlay" onclick="ssClose()"></div>' +
      '<div class="ss-panel" onclick="event.stopPropagation()">' +
        '<div class="ss-head">' +
          '<input id="ssSearch" placeholder="Type to search..." autocomplete="off" autocorrect="off" spellcheck="false">' +
          '<button class="ss-close" onclick="ssClose()">✕</button>' +
        '</div>' +
        '<div id="ssCount" class="ss-count"></div>' +
        '<div id="ssList" class="ss-list"></div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('ssSearch').addEventListener('input', function(e) {
      ssRenderList(e.target.value);
    });
  }

  // Filter list by query and render
  function ssRenderList(query) {
    if (!currentSelectId) return;
    var sel = document.getElementById(currentSelectId);
    if (!sel) return;
    var q = (query || '').trim().toLowerCase();
    var html = '';
    var current = sel.value;
    var count = 0;

    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      var label = opt.textContent;
      // Skip empty placeholder when filtering
      if (!opt.value && q) continue;
      if (q && label.toLowerCase().indexOf(q) === -1) continue;
      var isCurrent = (opt.value === current);
      var safeVal = String(opt.value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      var displayLabel = label.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html += '<div class="ss-item' + (isCurrent ? ' selected' : '') +
              '" onclick="ssPick(\'' + safeVal + '\')">' +
              (displayLabel || '— none —') + '</div>';
      count++;
    }
    if (!html) html = '<div class="ss-empty">No matches for "' + q + '"</div>';
    document.getElementById('ssList').innerHTML = html;
    document.getElementById('ssCount').textContent = count + ' option' + (count !== 1 ? 's' : '');
  }

  // Public: open modal for a select id
  window.ssOpen = function(selectId) {
    ensureModal();
    currentSelectId = selectId;
    document.getElementById('ssSearch').value = '';
    document.getElementById('ssModal').classList.add('open');
    ssRenderList('');
    setTimeout(function() { document.getElementById('ssSearch').focus(); }, 80);
  };

  // Public: close modal
  window.ssClose = function() {
    document.getElementById('ssModal').classList.remove('open');
    currentSelectId = null;
  };

  // Public: pick a value
  window.ssPick = function(value) {
    var sel = document.getElementById(currentSelectId);
    if (!sel) { ssClose(); return; }
    sel.value = value;
    updateTriggerLabel(currentSelectId);
    // Fire change event for existing handlers
    var evt = new Event('change', { bubbles: true });
    sel.dispatchEvent(evt);
    ssClose();
  };

  function updateTriggerLabel(selectId) {
    var sel = document.getElementById(selectId);
    var trigger = document.querySelector('[data-ss-for="' + selectId + '"]');
    if (!sel || !trigger) return;
    var lbl = trigger.querySelector('.ss-label');
    var selOpt = sel.options[sel.selectedIndex];
    if (selOpt && selOpt.value) {
      lbl.textContent = selOpt.textContent;
      trigger.classList.remove('placeholder');
    } else {
      lbl.textContent = (selOpt ? selOpt.textContent : '') || '— select —';
      trigger.classList.add('placeholder');
    }
  }

  // Public: convert a <select> into a searchable dropdown
  window.enhanceSelect = function(selectId, placeholder) {
    ensureModal();
    var sel = document.getElementById(selectId);
    if (!sel) return;
    if (sel.dataset.ssEnhanced === '1') {
      updateTriggerLabel(selectId);
      return;
    }
    sel.dataset.ssEnhanced = '1';

    // Hide original select but keep accessible
    sel.style.position = 'absolute';
    sel.style.opacity = '0';
    sel.style.pointerEvents = 'none';
    sel.style.width = '0';
    sel.style.height = '0';
    sel.style.padding = '0';
    sel.style.border = 'none';

    // Create visible trigger button before it
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ss-trigger placeholder';
    btn.setAttribute('data-ss-for', selectId);
    btn.innerHTML = '<span class="ss-label">' + (placeholder || '— select —') +
                    '</span><span class="ss-chev">▼</span>';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      ssOpen(selectId);
    });

    sel.parentNode.insertBefore(btn, sel);

    updateTriggerLabel(selectId);

    // Mirror 'error' class from select to button (existing validation works)
    var obs = new MutationObserver(function() {
      if (sel.classList.contains('error')) btn.classList.add('error');
      else btn.classList.remove('error');
    });
    obs.observe(sel, { attributes: true, attributeFilter: ['class'] });
  };

  // Public: call after options are added/removed to a select
  window.refreshSearchableSelect = updateTriggerLabel;
})();
