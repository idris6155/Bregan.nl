
(() => {
  const page = document.body.dataset.page || 'home';
  const lang = (new URLSearchParams(location.search).get('lang') || localStorage.getItem('breganLang') || 'en') === 'de' ? 'de' : 'en';
  const copy = (en, de) => lang === 'de' ? de : en;
  const addStyles = () => {
    if (document.querySelector('link[data-experience-css]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'assets/css/experience.css';
    l.dataset.experienceCss = '1';
    document.head.appendChild(l);
  };
  const particles = () => {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.nutrient-field')) return;
    const field = document.createElement('div');
    field.className = 'nutrient-field';
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('i');
      p.className = 'nutrient-particle';
      p.style.left = (48 + Math.random() * 48) + '%';
      p.style.top = (10 + Math.random() * 80) + '%';
      p.style.setProperty('--dur', (8 + Math.random() * 9) + 's');
      p.style.setProperty('--delay', (-Math.random() * 8) + 's');
      p.style.setProperty('--drift', ((Math.random() - .5) * 70) + 'px');
      p.style.setProperty('--opacity', (.18 + Math.random() * .48).toFixed(2));
      field.appendChild(p);
    }
    hero.appendChild(field);
  };
  const homeSections = () => {
    if (page !== 'home' || document.querySelector('.explore-deck')) return;
    const finder = document.querySelector('.section-tight');
    if (!finder) return;
    const explore = document.createElement('section');
    explore.className = 'explore-deck experience-shell';
    explore.innerHTML =
      '<div class="container">' +
        '<div class="explore-head reveal">' +
          '<div><span class="experience-kicker">' + copy('Explore by animal','Nach Tierart entdecken') + '</span><h2 class="experience-title">' + copy('Enter through the animal. Leave with a solution.','Beim Tier beginnen. Mit einer Lösung weitergehen.') + '</h2></div>' +
          '<p>' + copy('A faster way into the portfolio: choose the production system first, then narrow the challenge, product type and formulation need.','Ein schnellerer Einstieg ins Portfolio: zuerst Produktionssystem wählen, dann Herausforderung, Produkttyp und Formulierungsbedarf eingrenzen.') + '</p>' +
        '</div>' +
        '<div class="explore-rail">' +
          tile('01','🐔',copy('Poultry performance','Geflügelleistung'),copy('Broilers and layers: premixes, enzymes, toxin control, gut health and feed-efficiency concepts.','Broiler und Legehennen: Premixe, Enzyme, Toxinkontrolle, Darmgesundheit und Futtereffizienz.'),'products.html?species=Poultry&lang='+lang) +
          tile('02','◉',copy('Ruminant nutrition','Wiederkäuerernährung'),copy('Dairy and beef nutrition concepts built around utilization, resilience and consistent production.','Konzepte für Milch- und Mastrinder rund um Futterverwertung, Widerstandsfähigkeit und konstante Leistung.'),'products.html?species=Ruminants&lang='+lang) +
          tile('03','≈',copy('Aquaculture','Aquakultur'),copy('Premix and functional additive options for aquafeed, nutrient availability and growth.','Premix- und funktionelle Zusatzstoffoptionen für Aquafutter, Nährstoffverfügbarkeit und Wachstum.'),'products.html?species=Aqua&lang='+lang) +
        '</div>' +
      '</div>';
    finder.parentNode.insertBefore(explore, finder);

    const journey = document.createElement('section');
    journey.className = 'journey-stage';
    journey.innerHTML =
      '<div class="container journey-intro reveal">' +
        '<span class="experience-kicker">' + copy('From need to feed','Vom Bedarf zum Futter') + '</span>' +
        '<h2 class="experience-title">' + copy('Follow one Bregan solution through the chain.','Begleiten Sie eine Bregan-Lösung durch die gesamte Kette.') + '</h2>' +
        '<p class="experience-lead">' + copy('The product is only one part. Formulation, sourcing, production, documentation and delivery have to work as one system.','Das Produkt ist nur ein Teil. Formulierung, Beschaffung, Produktion, Dokumentation und Lieferung müssen als ein System funktionieren.') + '</p>' +
      '</div>' +
      '<div class="container journey-layout">' +
        '<div class="journey-visual reveal"><div class="journey-photo"></div><div class="journey-orbit"></div><div class="journey-center"><small id="journeyLabel">01 · ' + copy('DEFINE','DEFINIEREN') + '</small><strong id="journeyWord">' + copy('Start with the real production need.','Mit dem echten Produktionsbedarf beginnen.') + '</strong></div></div>' +
        '<div class="journey-steps">' +
          step('01',copy('Define the challenge','Herausforderung definieren'),copy('Species, age, feed format, raw materials, target performance and local constraints shape the brief.','Tierart, Alter, Futterform, Rohstoffe, Leistungsziel und lokale Rahmenbedingungen bestimmen das Briefing.'),['Species','FCR','Feed format']) +
          step('02',copy('Build the formulation','Formulierung aufbauen'),copy('Premixes, functional additives and ingredients are aligned with the nutritional and commercial objective.','Premixe, funktionelle Zusatzstoffe und Rohstoffe werden auf das ernährungsphysiologische und kommerzielle Ziel abgestimmt.'),['Premix','Additives','Ingredients']) +
          step('03',copy('Produce & verify','Produzieren & prüfen'),copy('Manufacturing, quality control and traceability protect consistency from batch to batch.','Produktion, Qualitätskontrolle und Rückverfolgbarkeit sichern die Konstanz von Charge zu Charge.'),['Quality','Traceability','Feed safety']) +
          step('04',copy('Move it worldwide','Weltweit bewegen'),copy('Packaging, export documentation and road, sea or air logistics are coordinated around the destination.','Verpackung, Exportdokumentation sowie Straßen-, See- oder Luftlogistik werden auf das Zielland abgestimmt.'),['Road','Sea','Air']) +
          step('05',copy('Stay after delivery','Nach der Lieferung bleiben'),copy('Technical, commercial and aftersales follow-up keeps the relationship connected to the next production cycle.','Technische, kommerzielle und Aftersales-Betreuung verbindet die Zusammenarbeit mit dem nächsten Produktionszyklus.'),['Technical','Commercial','Aftersales']) +
        '</div>' +
      '</div>';
    const products = document.querySelector('.products-section');
    (products || finder).parentNode.insertBefore(journey, products || finder);

    const proof = document.createElement('section');
    proof.className = 'proof-band';
    proof.innerHTML =
      '<div class="container">' +
        '<div class="proof-grid">' +
          proofCard('17',copy('core products already mapped in the digital portfolio','Kernprodukte bereits im digitalen Portfolio erfasst')) +
          proofCard('EN / DE',copy('complete bilingual navigation and product experience','vollständig zweisprachige Navigation und Produkterfahrung')) +
          proofCard('Road · Sea · Air',copy('international shipment routes considered from the start','internationale Transportwege von Anfang an berücksichtigt')) +
          proofCard('Breda → World',copy('Dutch commercial base with an international operating model','niederländische Basis mit internationalem Geschäftsmodell'),true) +
        '</div>' +
      '</div>';
    journey.parentNode.insertBefore(proof, journey.nextSibling);
  };
  function tile(n,icon,title,body,href){
    return '<a class="explore-tile reveal" href="'+href+'"><span class="explore-icon">'+icon+'</span><div class="explore-copy"><span class="explore-index">'+n+'</span><h3>'+title+'</h3><p>'+body+'</p><span class="explore-link">'+copy('Explore solutions','Lösungen entdecken')+' <span>↗</span></span></div></a>';
  }
  function step(n,title,body,tags){
    return '<article class="journey-step" data-journey-step="'+n+'"><span class="step-no">'+n+'</span><h3>'+title+'</h3><p>'+body+'</p><div class="journey-tags">'+tags.map(t=>'<span>'+t+'</span>').join('')+'</div></article>';
  }
  function proofCard(value,label,orange){
    return '<div class="proof-card reveal'+(orange?' orange':'')+'"><strong>'+value+'</strong><span>'+label+'</span></div>';
  }
  const journeyMotion = () => {
    const steps = [...document.querySelectorAll('.journey-step')];
    if (!steps.length) return;
    const label = document.getElementById('journeyLabel');
    const word = document.getElementById('journeyWord');
    const visual = document.querySelector('.journey-visual');
    const words = [
      copy('Start with the real production need.','Mit dem echten Produktionsbedarf beginnen.'),
      copy('Turn the brief into a nutrition system.','Das Briefing in ein Ernährungssystem übersetzen.'),
      copy('Protect consistency at production.','Konstanz in der Produktion sichern.'),
      copy('Connect documentation with logistics.','Dokumentation und Logistik verbinden.'),
      copy('Keep technical support in the loop.','Technische Betreuung im Kreislauf halten.')
    ];
    const labels = [
      copy('DEFINE','DEFINIEREN'),copy('FORMULATE','FORMULIEREN'),copy('VERIFY','PRÜFEN'),copy('DELIVER','LIEFERN'),copy('SUPPORT','BETREUEN')
    ];
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        steps.forEach(s => s.classList.remove('is-active'));
        e.target.classList.add('is-active');
        const i = steps.indexOf(e.target);
        if (label) label.textContent = String(i+1).padStart(2,'0')+' · '+labels[i];
        if (word) word.textContent = words[i];
        if (visual) {
          visual.style.setProperty('--journey-index',i);
          const photo = visual.querySelector('.journey-photo');
          if (photo) {
            photo.style.transform = 'scale('+(1.08+i*.025)+') translateX('+(i%2?'-2%':'1%')+')';
            photo.style.filter = 'saturate('+(0.9+i*.05)+')';
          }
        }
      });
    }, {threshold:.48});
    steps.forEach(s => obs.observe(s));
  };
  const interactions = () => {
    if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const cursor = document.createElement('div');
      cursor.className = 'experience-cursor';
      document.body.appendChild(cursor);
      addEventListener('mousemove', e => {
        cursor.classList.add('show');
        cursor.style.left = e.clientX+'px';
        cursor.style.top = e.clientY+'px';
      }, {passive:true});
      document.addEventListener('mouseover', e => cursor.classList.toggle('hot',!!e.target.closest('a,button,.product-card,.species-card')));
      document.addEventListener('mouseout', e => { if (!e.relatedTarget) cursor.classList.remove('show'); });
      document.querySelectorAll('.species-card,.product-card,.cap-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          const rx = ((e.clientY-r.top)/r.height-.5)*-7;
          const ry = ((e.clientX-r.left)/r.width-.5)*9;
          card.style.transform = 'perspective(900px) rotateX('+rx+'deg) rotateY('+ry+'deg) translateY(-5px)';
        });
        card.addEventListener('mouseleave', () => card.style.transform='');
      });
      const heroBg = document.querySelector('.hero-bg');
      addEventListener('mousemove', e => {
        if (!heroBg) return;
        const x = (e.clientX / innerWidth - .5) * 10;
        const y = (e.clientY / innerHeight - .5) * 7;
        heroBg.style.transform = 'scale(1.045) translate('+(-x)+'px,'+(-y)+'px)';
      }, {passive:true});
    }
    const glow = document.createElement('i');
    glow.className='page-glow';
    document.body.appendChild(glow);
  };
  const quickFinder = () => {
    const f = document.querySelector('.finder-control .fake-input');
    if (!f) return;
    f.setAttribute('role','button');
    f.setAttribute('tabindex','0');
    const go = () => { location.href='products.html?lang='+lang; };
    f.addEventListener('click',go);
    f.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')go();});
  };
  const init = () => {
    addStyles();
    particles();
    homeSections();
    setTimeout(() => {
      journeyMotion();
      interactions();
      quickFinder();
      document.querySelectorAll('.explore-deck .reveal,.journey-stage .reveal,.proof-band .reveal').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight*.95) el.classList.add('in-view');
      });
    }, 80);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded',init) : init();
})();
