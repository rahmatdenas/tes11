'use strict';

// ============================================================
// PENINGKATAN TAMPILAN PONSEL (Mobile Enhancements)
//
// Skrip ini TIDAK mengubah logika aplikasi yang sudah ada di
// eph-common.js / eph-heritage-sites.js. Skrip ini hanya:
//
//  1. Menambahkan "pegangan" (handle) di bagian atas #panel
//     sehingga panel berfungsi sebagai bottom sheet yang bisa
//     ditarik (drag) atau diketuk untuk dibuka/ditutup.
//  2. Secara default panel dalam keadaan tertutup, sehingga
//     peta tampil penuh sebagai latar belakang.
//  3. Saat sebuah marker peta diklik (popup terbuka), panel
//     otomatis terbuka penuh agar pengguna langsung melihat
//     info situsnya.
//
// Tampilan desktop (lebar > 800px) tidak terpengaruh sama
// sekali oleh skrip ini.
// ============================================================

(function() {

  var MOBILE_QUERY   = '(max-width: 800px)';
  var HANDLE_HEIGHT  = 56;   // harus sama dengan tinggi #panel-handle di CSS
  var DRAG_THRESHOLD = 5;    // px, untuk membedakan tap vs drag

  var panel, handle, handleLabel;
  var currentY    = 0;       // posisi translateY panel saat ini (px)
  var dragging    = false;
  var moved       = false;
  var startClientY  = 0;
  var startTranslate = 0;

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  // Jarak translateY saat panel tertutup (hanya handle terlihat)
  function collapsedTranslate() {
    return Math.max(panel.offsetHeight - HANDLE_HEIGHT, 0);
  }

  function clampY(y) {
    return Math.min(Math.max(y, 0), collapsedTranslate());
  }

  function applyTransform(y) {
    currentY = y;
    panel.style.transform = 'translateY(' + y + 'px)';
  }

  function updateLabel(expanded) {
    if (!handleLabel) return;
    handleLabel.textContent = expanded
      ? 'Tarik turun untuk lihat peta'
      : 'Tarik naik untuk lihat daftar';
  }

  function setExpanded(expand, animate) {
    if (animate !== false) {
      panel.classList.remove('eph-dragging');
    }
    applyTransform(expand ? 0 : collapsedTranslate());
    updateLabel(expand);
  }

  function isExpanded() {
    return currentY < collapsedTranslate() / 2;
  }

  function getClientY(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
    return e.clientY;
  }

  function onPointerDown(e) {
    if (!isMobile()) return;
    dragging = true;
    moved = false;
    startClientY = getClientY(e);
    startTranslate = currentY;
    panel.classList.add('eph-dragging');

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    var clientY = getClientY(e);
    var delta = clientY - startClientY;
    if (Math.abs(delta) > DRAG_THRESHOLD) moved = true;
    applyTransform(clampY(startTranslate + delta));
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);

    var collapsed = collapsedTranslate();

    if (!moved) {
      // Dianggap sebagai ketukan: alihkan status terbuka/tertutup
      setExpanded(currentY > collapsed / 2);
    }
    else {
      // Dianggap sebagai tarikan: snap ke posisi terdekat
      setExpanded(currentY < collapsed / 2);
    }

    panel.classList.remove('eph-dragging');
  }

  function buildHandle() {
    handle = document.createElement('div');
    handle.id = 'panel-handle';

    var grip = document.createElement('div');
    grip.className = 'eph-grip';

    handleLabel = document.createElement('div');
    handleLabel.className = 'eph-handle-label';

    handle.appendChild(grip);
    handle.appendChild(handleLabel);
    panel.insertBefore(handle, panel.firstChild);

    handle.addEventListener('pointerdown', onPointerDown);
  }

  function handleViewportChange() {
    if (!panel) return;

    if (isMobile()) {
      if (!handle) buildHandle();
      // Default: panel tertutup, peta terlihat penuh.
      setExpanded(false, false);
    }
    else {
      // Kembali ke tampilan desktop: hapus transform inline
      // supaya layout asli (CSS desktop) berlaku lagi.
      panel.style.transform = '';
      panel.classList.remove('eph-dragging');
      currentY = 0;
    }
  }

  window.addEventListener('load', function() {
    panel = document.getElementById('panel');
    if (!panel) return;

    handleViewportChange();

    // Saat marker peta diklik & popup terbuka, otomatis buka
    // panel penuh di mode ponsel agar info situs terlihat.
    if (window.Map) {
      Map.on('popupopen', function() {
        if (isMobile()) setExpanded(true);
      });
    }
  });

  window.addEventListener('resize', handleViewportChange);

})();