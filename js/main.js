

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
  function createExpoziceCard(expozice, index) {
    return `
      <div class="col-lg-4 col-md-6 fade-in">
        <div class="exhibition-card">

          <div class="image-box">

            <img src="${expozice.obrazek.trim()}" alt="${expozice.nazev}" loading="lazy" />

            ${
              index === 0
                ? '<span class="premiere">PREMIÉRA</span>'
                : ''
            }

          </div>

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
Světlo a stín,"Přelomová výstava představující nejvýznamnější barokní mistry z evropských sbírek. Více než 80 originálních děl.",Barokní umění, ../obrazky/vystava1.avif
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
    list.innerHTML = expozice.map((item, index) => createExpoziceCard(item, index)).join('');

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

  /*
    PHP soubor ../php/tickets.php bude fungovat jen na serveru s PHP.
    Na GitHub Pages PHP nebezi, proto je tady i JS zaloha pres localStorage.
  */
  const ticketsApiUrl = '../php/tickets.php';

  /* ceny vstupenek podle typu */
  const prices = {
    'Dospělí': 220,
    'Student': 150,
    'Senior': 140,
    'Rodina': 480,
    'Dítě': 0
  };

  let selectedTicket = 'Dospělí';

  function setTicketMessage(message, type = 'info') {
    const messageEl = byId('ticket-message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `ticket-message ${type}`;
  }

  function getTicketFormData() {
    const type = byId('modal-type')?.value || 'Dospělí';
    const quantity = Number(byId('modal-qty')?.value || 1);
    const price = prices[type] || 0;

    return {
      id: `LM-${Date.now()}`,
      name: byId('modal-name')?.value.trim() || '',
      email: byId('modal-email')?.value.trim() || '',
      date: byId('modal-date')?.value || '',
      time: byId('modal-time')?.value || '',
      type,
      quantity,
      price,
      total: price * quantity,
      createdAt: new Date().toISOString()
    };
  }

  function updateOrderSummary() {
    const data = getTicketFormData();

    byId('modal-ticket-type') && (byId('modal-ticket-type').textContent = data.type);
    byId('modal-ticket-price') && (byId('modal-ticket-price').textContent = `${data.price.toLocaleString('cs-CZ')} Kč / ks`);
    byId('order-total') && (byId('order-total').textContent = `${data.total.toLocaleString('cs-CZ')} Kč`);
  }

  function saveTicketLocally(ticket) {
    const savedTickets = JSON.parse(localStorage.getItem('lumisTickets') || '[]');
    savedTickets.push(ticket);
    localStorage.setItem('lumisTickets', JSON.stringify(savedTickets));
  }

  async function saveTicket(ticket) {
    try {
      const response = await fetch(ticketsApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });

      if (!response.ok) throw new Error('PHP endpoint neodpověděl správně.');

      return await response.json();
    } catch (error) {
      /* GitHub Pages neumí PHP, proto se objednávka uloží aspoň v prohlížeči. */
      saveTicketLocally(ticket);
      return {
        ok: true,
        fallback: true,
        message: 'Objednávka je uložená v prohlížeči, protože PHP tady neběží.'
      };
    }
  }

  function resetTicketForm() {
    byId('modal-name') && (byId('modal-name').value = '');
    byId('modal-email') && (byId('modal-email').value = '');
    byId('modal-date') && (byId('modal-date').value = '');
    byId('modal-qty') && (byId('modal-qty').value = 1);
    setTicketMessage('');
    updateOrderSummary();
  }

  $$('.ticket-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.ticket-card').forEach(item => item.classList.remove('selected-ticket'));
      card.classList.add('selected-ticket');

      selectedTicket = card.dataset.type || 'Dospělí';
      byId('modal-type') && (byId('modal-type').value = selectedTicket);

      updateOrderSummary();
    });
  });

  byId('modal-type')?.addEventListener('change', () => {
    selectedTicket = byId('modal-type').value;
    updateOrderSummary();
  });

  byId('modal-qty')?.addEventListener('input', updateOrderSummary);
  byId('modal-date')?.addEventListener('change', () => setTicketMessage(''));

  $$('[data-bs-target="#ticketModal"]').forEach(button => {
    button.addEventListener('click', () => {
      byId('modal-type') && (byId('modal-type').value = selectedTicket);
      setTicketMessage('');
      updateOrderSummary();
    });
  });

  byId('confirm-purchase')?.addEventListener('click', async () => {
    const ticket = getTicketFormData();

    if (!ticket.name || !ticket.email || !ticket.date || !ticket.time) {
      setTicketMessage('Prosím vyplňte jméno, e-mail, datum a čas návštěvy.', 'error');
      return;
    }

    if (!ticket.email.includes('@')) {
      setTicketMessage('Zadejte platný e-mail.', 'error');
      return;
    }

    setTicketMessage('Ukládám objednávku...', 'info');

    const result = await saveTicket(ticket);

    if (!result.ok) {
      setTicketMessage('Objednávku se nepodařilo uložit. Zkuste to prosím znovu.', 'error');
      return;
    }

    bootstrap.Modal.getInstance(byId('ticketModal'))?.hide();

    setTimeout(() => {
      alert(
        `Děkujeme za nákup!\n\n` +
        `Číslo objednávky: ${ticket.id}\n` +
        `Typ: ${ticket.type}\n` +
        `Počet: ${ticket.quantity}\n` +
        `Celkem: ${ticket.total.toLocaleString('cs-CZ')} Kč\n\n` +
        (result.fallback
          ? 'Poznámka: Na GitHub Pages se objednávka ukládá jen do prohlížeče, protože PHP tam neběží.'
          : 'Objednávka byla uložena přes PHP.')
      );
      resetTicketForm();
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
