(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* year */
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* event categories (events-data.js) */
  var cats = window.NEV_CATEGORIES || [], evs = window.NEV_EVENTS || [];
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var catBox = $('#cats');
  if (catBox) {
    catBox.innerHTML = cats.map(function (c, i) {
      var count = evs.filter(function (e) { return e.category === c.name; }).length;
      return '<article class="cat" role="listitem" data-reveal style="--d:' + (i * .08) + 's' + (c.image ? ';--img:url(' + esc(new URL(c.image, location.href).href) + ')' : '') + '">' +
        '<span class="cat__n">0' + (i + 1) + '</span><h3>' + esc(c.name) + '</h3><p>' + esc(c.note) + '</p>' +
        (count ? '' : '<span class="cat__soon">Yakında</span>') + '</article>';
    }).join('');
  }

  /* value numerals */
  $$('.value').forEach(function (v, i) { v.setAttribute('data-n', '0' + (i + 1)); });

  /* loader + hero intro */
  var hero = $('.hero'), loader = $('.loader');
  function go() { hero.classList.add('go'); }
  if (reduce) { go(); }
  else {
    var started = false;
    var finish = function () {
      if (started) return; started = true;
      loader.classList.add('done');
      setTimeout(go, 500);
      setTimeout(function () { loader.classList.add('gone'); }, 1400);
    };
    window.addEventListener('load', function () { setTimeout(finish, 3500); });
    setTimeout(finish, 4800);
  }

  /* reveal on scroll */
  var targets = $$('[data-reveal], [data-values], .triad, .title, .story__title, .manifesto__h, .story__top, .sig:not([data-reveal])');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { if (!t.closest('.hero')) io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }
  /* values: panels follow their container, one after another */
  $$('[data-values]').forEach(function (box) {
    var kids = $$('.value', box);
    var show = function () { kids.forEach(function (k, i) { setTimeout(function () { k.classList.add('in'); }, 250 + i * 250); }); };
    if (box.classList.contains('in')) show();
    new MutationObserver(function () { if (box.classList.contains('in')) show(); })
      .observe(box, { attributes: true, attributeFilter: ['class'] });
  });

  /* header, progress, parallax, active link */
  var header = $('.header'), bar = $('.progress i');
  var par = $$('[data-parallax]'), links = $$('.nav a[href^="#"]:not(.btn)');
  var secs = links.map(function (a) { return $(a.getAttribute('href')); });
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 40);
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (!reduce && innerWidth > 700) {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        var k = parseFloat(el.dataset.parallax) || .1;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -k).toFixed(1) + 'px,0)';
      });
    }
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === cur && cur > 0); });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  frame();

  /* mobile menu */
  var burger = $('#burger'), nav = $('#nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', function () { if (innerWidth > 1100) setMenu(false); });

  /* magnetic buttons */
  if (window.matchMedia('(hover: hover)').matches && !reduce) {
    $$('.btn:not(.nav__cta)').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .12).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .22).toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* contact form (Netlify Forms) */
  var form = $('.form');
  if (form) {
    var status = $('.form__status', form), btn = $('button', form);
    var rules = {
      ad: function (v) { return v.trim().length > 1; },
      eposta: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
      mesaj: function (v) { return v.trim().length > 4; }
    };
    var check = function (el) { var r = rules[el.name]; if (!r) return true; var ok = r(el.value); el.parentNode.classList.toggle('bad', !ok); return ok; };
    $$('input,textarea', form).forEach(function (el) { el.addEventListener('blur', function () { check(el); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var all = $$('input,textarea', form).map(check);
      if (all.indexOf(false) > -1) { status.className = 'form__status fail'; status.textContent = 'Lütfen işaretli alanları kontrol edin.'; return; }
      btn.disabled = true; status.className = 'form__status'; status.textContent = 'Gönderiliyor…';
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw 0; form.reset(); status.className = 'form__status ok'; status.textContent = 'Mesajınız iletildi. Teşekkür ederiz.'; })
        .catch(function () { status.className = 'form__status fail'; status.textContent = 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin veya sosyal medyadan yazın.'; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
