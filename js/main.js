/* ПОДБОР — рендер каталога + фильтры */
(function () {
  "use strict";

  var CAT_NAMES = {
    credit: "Кредитные карты",
    debit: "Дебетовые карты",
    mfo: "Займы онлайн",
    rko: "Бизнес и РКО"
  };

  /* админка может положить правки в localStorage — они важнее data.js */
  function loadData() {
    try {
      var raw = localStorage.getItem("vitrina_data");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.offers && parsed.offers.length) return parsed;
      }
    } catch (e) { /* приватный режим и т.п. — молча берём data.js */ }
    return window.VITRINA || { offers: [] };
  }

  var DATA = loadData();
  var grid = document.querySelector("[data-offers]");
  var countLine = document.querySelector("[data-count-line]");
  var current = "all";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function logoHtml(offer) {
    var l = offer.logo || {};
    if (l.type === "img" && l.value) {
      return '<span class="offer-logo"><img src="' + esc(l.value) + '" alt=""></span>';
    }
    return '<span class="offer-logo" style="background:' + esc(l.bg || "#111214") +
      ";color:" + esc(l.fg || "#fff") + '" aria-hidden="true">' + esc(l.value || "•") + "</span>";
  }

  var CHECK_SVG = '<svg class="i-check" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8"/><path class="tick" d="M4.5 8.2l2.3 2.3 4.7-4.8"/></svg>';

  function cardHtml(o) {
    var newTab = o.link && o.link !== "#";
    return (
      '<li class="offer-item" data-cat="' + esc(o.cat) + '">' +
      '<article class="offer-card' + (o.badge === "Хит" ? " offer-card-dark" : "") + '">' +
      (o.badge ? '<span class="offer-badge">' + esc(o.badge) + "</span>" : "") +
      '<div class="offer-head">' + logoHtml(o) +
      "<div><h3 class=\"offer-name\">" + esc(o.name) + "</h3>" +
      '<p class="offer-tagline">' + esc(o.tagline || CAT_NAMES[o.cat] || "") + "</p></div></div>" +
      '<p class="offer-big"><b>' + esc(o.big || "") + "</b><span>" + esc(o.bigNote || "") + "</span></p>" +
      (o.chips && o.chips.length
        ? '<ul class="offer-chips">' + o.chips.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>"
        : "") +
      '<ul class="offer-features">' +
      (o.features || []).map(function (f) { return "<li>" + CHECK_SVG + esc(f) + "</li>"; }).join("") +
      "</ul>" +
      '<a class="offer-cta" href="' + esc(o.link || "#") + '"' +
      (newTab ? ' target="_blank" rel="noopener"' : "") +
      ' aria-label="Оформить — ' + esc(o.name) + (newTab ? " (откроется в новой вкладке)" : "") + '">Оформить</a>' +
      "</article></li>"
    );
  }

  function render() {
    if (!grid) return;
    var list = DATA.offers.filter(function (o) {
      return current === "all" || o.cat === current;
    });
    grid.innerHTML = list.length
      ? list.map(cardHtml).join("")
      : '<li class="offers-empty">В этой категории пока пусто — загляните позже.</li>';
    if (countLine) {
      countLine.textContent = current === "all"
        ? "Показаны все предложения: " + list.length
        : (CAT_NAMES[current] || "") + " — " + list.length + " шт.";
    }
  }

  /* фильтры */
  var filterBtns = [].slice.call(document.querySelectorAll(".filter-btn"));
  function setFilter(cat, opts) {
    current = cat;
    filterBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === cat ? "true" : "false");
    });
    render();
    if (opts && opts.scroll) {
      var target = document.getElementById("catalog");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () { setFilter(b.getAttribute("data-filter")); });
  });

  /* карточки категорий и ссылки в футере ведут в каталог с фильтром */
  [].slice.call(document.querySelectorAll("[data-goto-cat]")).forEach(function (a) {
    a.addEventListener("click", function () {
      setFilter(a.getAttribute("data-goto-cat"));
      /* переход по якорю #catalog произойдёт сам */
    });
  });

  /* подстановка бренда/даты/кол-ва из данных */
  [].slice.call(document.querySelectorAll("[data-brand]")).forEach(function (el) {
    if (DATA.brand) el.textContent = DATA.brand;
  });
  [].slice.call(document.querySelectorAll("[data-updated]")).forEach(function (el) {
    if (DATA.updated) el.textContent = DATA.updated;
  });
  var cnt = document.querySelector("[data-brand-count]");
  if (cnt) cnt.textContent = DATA.offers.length;
  if (DATA.brand) {
    document.title = DATA.brand + " — витрина финансовых предложений: карты, займы, счета";
  }

  /* табы «Как это работает» (роль tablist + стрелки) */
  var stepTabs = [].slice.call(document.querySelectorAll(".steps-tab"));
  var stepPanels = [].slice.call(document.querySelectorAll(".steps-panel"));
  function selectStep(idx, focus) {
    stepTabs.forEach(function (t, i) {
      var on = i === idx;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    stepPanels.forEach(function (p, i) {
      if (i === idx) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  }
  stepTabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectStep(i); });
    t.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = (i + 1) % stepTabs.length;
      else if (e.key === "ArrowLeft") n = (i - 1 + stepTabs.length) % stepTabs.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = stepTabs.length - 1;
      if (n !== null) { e.preventDefault(); selectStep(n, true); }
    });
  });

  /* анимация баров статистики при появлении */
  var why = document.querySelector(".why-card");
  if (why && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { why.classList.add("bars-in"); io.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe(why);
  } else if (why) {
    why.classList.add("bars-in");
  }

  render();
})();
