/* ===== LUMIS MUSEUM — HLAVNI JS ===== */

/* kod se spusti az po nacteni cele stranky */
document.addEventListener('DOMContentLoaded', () => {

  /* zkracena verze document.querySelector */
  const $ = (selector) => document.querySelector(selector);

  /* zkracena verze document.querySelectorAll */
  const $$ = (selector) => document.querySelectorAll(selector);

  /* zkracena verze document.getElementById */
  const byId = (id) => document.getElementById(id);


  /* ===== NAVBAR ===== */

  /* najde navbar podle id */
  const navbar = byId('navbar');

  /* kdyz se scrolluje, tak se navbar trochu zmeni */
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* najde vsechny odkazy v menu */
  const navLinks = $$('.navbar-nav .nav-link');

  /* funkce oznaci aktivni odkaz v menu */
  const setActiveLink = (id) => {
    navLinks.forEach(link => 
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`)
    );
  };


  /* sleduje sekce na strance */
  const sectionObserver = new IntersectionObserver((entries) => {

    /* projde vsechny sledovane sekce */
    entries.forEach(entry => {

      /* kdyz je sekce videt, oznaci se odkaz v menu */
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });

  }, { 
    /* sekce musi byt videt aspon z 40 % */
    threshold: 0.4 
  });

  /* zacne sledovat vsechny sekce, ktere maji id */
  $$('section[id]').forEach(section => sectionObserver.observe(section));


  /* ===== ANIMACE PRI SCROLLU ===== */

  /* sleduje prvky, ktere se maji objevit animaci */
  const fadeObserver = new IntersectionObserver((entries) => {

    entries.forEach((entry, index) => {

      /* kdyz prvek jeste neni videt, nic se nestane */
      if (!entry.isIntersecting) return;

      /* po male chvilce prida tridu visible */
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 80);

      /* po animaci uz prvek dal nesleduje */
      fadeObserver.unobserve(entry.target);
    });

  }, { 
    /* animace se spusti kdyz je videt aspon 10 % prvku */
    threshold: 0.1 
  });

  /* zacne sledovat vsechny prvky s tridou fade-in */
  $$('.fade-in').forEach(el => fadeObserver.observe(el));


  /* ===== DYNAMICKE EXPOZICE Z CSV ===== */

  /* jednoducha funkce na cteni CSV radku
     CSV je tabulka ulozena jako text, kde jsou hodnoty oddelene carkou */
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    /* prochazim kazdy znak, protoze popis muze obsahovat carku v uvozovkach */
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      /* kdyz jsou dve uvozovky za sebou, znamena to jedna uvozovka v textu */
      if (char === '"' && nextChar === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(value.trim());
        value = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (value || row.length) {
          row.push(value.trim());
          rows.push(row);
          row = [];
          value = '';
        }
      } else {
        value += char;
      }
    }

    if (value || row.length) {
      row.push(value.trim());
      rows.push(row);
    }

    const headers = rows.shift();

    /* z radku udelam objekty, aby se s tim lepe pracovalo */
    return rows.map(rowData => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = rowData[index] || '';
      });
      return item;
    });
  }

  /* tato funkce vytvori HTML kartu pro jednu expozici */
  function createExpoziceCard(expozice) {
    return `
      <div class="col-lg-4 col-md-6 fade-in">
        <div class="exhibition-card">
          <img src="${expozice.obrazek}" alt="${expozice.nazev}" loading="lazy" />
          <div class="exhibition-body">
            <span class="exhibition-tag">${expozice.kategorie}</span>
            <h3>${expozice.nazev}</h3>
            <p>${expozice.popis}</p>
          </div>
        </div>
      </div>
    `;
  }

  /* zalozni CSV primo v JavaScriptu
     diky tomu budou expozice fungovat i kdyz prohlizec zablokuje fetch */
  const zalozniCSV = `nazev,popis,kategorie,obrazek
Světlo a stín,"Přelomová výstava představující nejvýznamnější barokní mistry z evropských sbírek. Více než 80 originálních děl.",Barokní umění,../obrazky/vystava1.avif
Forma a prostor,"Moderní a současné sochařství v dialogu s architekturou muzea. Interaktivní instalace pozývají k fyzické účasti.",Moderní sochařství, ../obrazky/vystava2.avif
Od gotiky k moderně,"Chronologická procházka sedmi staletími českého a středoevropského umění. Ikony naší národní kulturní paměti.",Stálá sbírka, ../obrazky/vystava3.avif
Objektiv svědka,"Dokumentární fotografie 20. století a svědectví o zlomových okamžicích dějin.",Fotografie, ../obrazky/vystava4.avif
Poklady starověkého Egypta,"Unikátní kolekce egyptských artefaktů zapůjčená z Káhirského muzea.",Archeologie, ../obrazky/vystava5.avif
Portréty identity,"Mezinárodní skupinová výstava zkoumá témata identity, původu a přináležitosti.",Současné umění, ../obrazky/vystava6.avif`;

  /* vypise expozice na stranku */
  function showExpozice(csvText) {
    const list = byId('expozice-list');
    if (!list) return;

    const expozice = parseCSV(csvText);

    /* vsechny karty se vlozi do divu v HTML */
    list.innerHTML = expozice.map(createExpoziceCard).join('');

    /* nove vytvorene karty se taky napoji na fade-in animaci */
    list.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));
  }

  /* nacte CSV soubor z data/expozice.csv
     na GitHub Pages to funguje, protoze GitHub Pages je server */
  function loadExpozice() {
    fetch('../data/expozice.csv')
      .then(response => {
        if (!response.ok) throw new Error('CSV se nenaslo');
        return response.text();
      })
      .then(text => showExpozice(text))
      .catch(() => {
        /* kdyz CSV nepujde nacist, pouzije se zalozni CSV nahore */
        showExpozice(zalozniCSV);
      });
  }

  loadExpozice();


  /* ===== COUNTDOWN ===== */

  /* datum a cas, do ktereho se odpocitava */
  const countdownDate = new Date('2026-08-28T10:00:00');

  /* id prvku, kam se budou psat dny, hodiny, minuty a sekundy */
  const countdownIds = ['days', 'hours', 'mins', 'secs'];

  /* funkce prepocita zbyvajici cas */
  function updateCountdown() {
    const diff = countdownDate - new Date();

    /* kdyz uz datum nastalo */
    if (diff <= 0) {
      countdownIds.forEach(id => {
        byId(`count-${id}`).textContent = '00';
      });

      const label = byId('countdown-event-label');

      if (label) {
        label.textContent = 'Výstava právě probíhá';
      }

      return;
    }

    /* prepocet milisekund na dny, hodiny, minuty a sekundy */
    const values = [
      Math.floor(diff / 86400000),
      Math.floor(diff / 3600000) % 24,
      Math.floor(diff / 60000) % 60,
      Math.floor(diff / 1000) % 60
    ];

    /* zapise hodnoty do HTML */
    countdownIds.forEach((id, index) => {
      byId(`count-${id}`).textContent = String(values[index]).padStart(2, '0');
    });
  }

  /* hned spusti countdown */
  updateCountdown();

  /* countdown se obnovuje kazdou sekundu */
  setInterval(updateCountdown, 1000);


  /* ===== LIGHTBOX ===== */

  /* najde velke okno s obrazkem */
  const lightbox = byId('lightbox');

  /* najde obrazek uvnitr lightboxu */
  const lightboxImg = byId('lightbox-img');

  /* funkce zavre lightbox */
  function closeLightbox() {
    lightbox?.classList.remove('active');

    /* znovu povoli scrollovani stranky */
    document.body.style.overflow = '';
  }

  /* po kliknuti na obrazek v galerii se otevre lightbox */
  $$('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {

      /* vezme obrazek z galerie a vlozi ho do lightboxu */
      lightboxImg.src = item.querySelector('img').src;

      /* zobrazi lightbox */
      lightbox.classList.add('active');

      /* zakaze scrollovani stranky */
      document.body.style.overflow = 'hidden';
    });
  });

  /* zavreni tlacitkem */
  byId('lightbox-close')?.addEventListener('click', closeLightbox);

  /* zavreni kliknutim mimo obrazek */
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  /* zavreni klavesou Escape */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });


  /* ===== VSTUPENKY ===== */

  /* ceny vstupenek podle typu */
  const prices = { 
    'Dospělí': 220, 
    'Student': 150, 
    'Senior': 140, 
    'Rodina': 480, 
    'Dítě': 0 
  };

  /* sem se ulozi vybrana vstupenka */
  let selectedTicket = null;

  /* prepocita cenu objednavky */
  function updateOrderSummary() {

    /* typ vstupenky z formulare */
    const type = byId('modal-type')?.value;

    /* pocet vstupenek */
    const quantity = Number(byId('modal-qty')?.value || 1);

    /* celkova cena */
    const total = (prices[type] || 0) * quantity;

    /* misto, kam se zapise cena */
    const totalEl = byId('order-total');

    if (totalEl) {
      totalEl.textContent = `${total.toLocaleString('cs-CZ')} Kč`;
    }
  }

  /* kliknuti na kartu vstupenky */
  $$('.ticket-card').forEach(card => {
    card.addEventListener('click', () => {

      /* odstrani oznaceni ze vsech karet */
      $$('.ticket-card').forEach(item => item.classList.remove('selected-ticket'));

      /* oznaci kliknutou kartu */
      card.classList.add('selected-ticket');

      /* ulozi typ vstupenky */
      selectedTicket = card.dataset.type;

      /* zapise info do modalu */
      byId('modal-ticket-type').textContent = card.dataset.type;
      byId('modal-ticket-price').textContent = `${card.dataset.price} Kč`;
      byId('modal-type').value = card.dataset.type;

      /* prepocita cenu */
      updateOrderSummary();
    });
  });

  /* kdyz se zmeni typ vstupenky */
  byId('modal-type')?.addEventListener('change', updateOrderSummary);

  /* kdyz se zmeni pocet vstupenek */
  byId('modal-qty')?.addEventListener('change', updateOrderSummary);

  /* pred otevrenim modalu se nastavi cena */
  $$('[data-bs-target="#ticketModal"]').forEach(button => {
    button.addEventListener('click', () => {
      if (selectedTicket) {
        byId('modal-type').value = selectedTicket;
      }

      updateOrderSummary();
    });
  });

  /* potvrzeni nakupu */
  byId('confirm-purchase')?.addEventListener('click', () => {

    /* vezme jmeno a email z formulare */
    const name = byId('modal-name')?.value.trim();
    const email = byId('modal-email')?.value.trim();

    /* kdyz neni vyplneno jmeno nebo email */
    if (!name || !email) {
      alert('Prosím vyplňte jméno a e-mail.');
      return;
    }

    /* zavre bootstrap modal */
    bootstrap.Modal.getInstance(byId('ticketModal'))?.hide();

    /* po chvilce ukaze potvrzeni */
    setTimeout(() => {
      alert('Děkujeme za nákup! Vstupenky vám zašleme na e-mail.');
    }, 300);
  });


  /* ===== PLYNULE POSOUVANI ===== */

  /* vybere vsechny odkazy, ktere vedou na cast stranky */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (event) => {

      /* najde cil podle href odkazu */
      const target = $(link.getAttribute('href'));

      /* kdyz cil neexistuje, nic se nestane */
      if (!target) return;

      /* vypne klasicke skoceni na odkaz */
      event.preventDefault();

      /* posune stranku plynule na cil */
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });

      /* najde mobilni menu */
      const navMenu = byId('navMenu');

      /* kdyz je menu otevrene, tak se zavre */
      if (navMenu?.classList.contains('show')) {
        bootstrap.Collapse.getInstance(navMenu)?.hide();
      }
    });
  });
});
