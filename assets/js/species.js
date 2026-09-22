(() => {
  const PRODUCTS=window.BREGAN_PRODUCTS||[];
  const lang=(new URLSearchParams(location.search).get('lang')||localStorage.getItem('breganLang')||'en')==='de'?'de':'en';
  const c=(en,de)=>lang==='de'?de:en;
  const species=document.body.dataset.species||'Poultry';
  const config={
    Poultry:{
      kicker:'POULTRY NUTRITION',
      title:[ 'Precision nutrition for broilers and layers.', 'Präzise Ernährung für Broiler und Legehennen.' ],
      intro:[ 'Explore premixes, feed additives and functional solutions mapped to poultry production challenges — from feed efficiency and gut health to toxin pressure, egg quality and feed safety.',
              'Entdecken Sie Premixe, Futterzusätze und funktionelle Lösungen für Geflügel — von Futtereffizienz und Darmgesundheit bis Toxindruck, Eiqualität und Futtermittelsicherheit.' ],
      hero:'poultry',
      symbol:'🐔',
      stages:[
        ['Starter & early growth','Starter & frühes Wachstum','Build the nutritional foundation for intake, skeletal development and resilient early performance.','Die ernährungsphysiologische Grundlage für Futteraufnahme, Skelettentwicklung und robuste frühe Leistung schaffen.'],
        ['Grower & finisher','Grower & Finisher','Focus on feed conversion, nutrient release, gut function and production consistency.','Futterverwertung, Nährstofffreisetzung, Darmfunktion und Produktionskonstanz fokussieren.'],
        ['Layer production','Legehennenproduktion','Support egg quality, mineral supply, shell integrity and sustained laying performance.','Eiqualität, Mineralstoffversorgung, Schalenintegrität und anhaltende Legeleistung unterstützen.']
      ],
      challenges:['Feed efficiency','Mycotoxins','Egg and meat quality','Feed safety','Low growth rate','Skeletal development']
    },
    Ruminants:{
      kicker:'RUMINANT NUTRITION',
      title:[ 'Nutrition built around utilization, resilience and output.', 'Ernährung rund um Nutzung, Widerstandsfähigkeit und Leistung.' ],
      intro:[ 'Explore premix and additive concepts for dairy and beef production, with attention to mineral value, feed utilization, consistency and practical farm performance.',
              'Entdecken Sie Premix- und Zusatzstoffkonzepte für Milch- und Mastbetriebe mit Fokus auf Mineralstoffwert, Futterverwertung, Konstanz und praktische Leistung.' ],
      hero:'ruminant',
      symbol:'🐄',
      stages:[
        ['Dairy performance','Milchleistung','Align vitamins, minerals and functional support with intake, milk output and herd consistency.','Vitamine, Mineralstoffe und funktionelle Unterstützung mit Futteraufnahme, Milchleistung und Herdenkonstanz abstimmen.'],
        ['Beef production','Rindermast','Build programs around feed utilization, growth and robust performance under commercial conditions.','Programme rund um Futterverwertung, Wachstum und robuste Leistung unter Praxisbedingungen entwickeln.'],
        ['Mineral strategy','Mineralstoffstrategie','Consider source, bioavailability and antagonists — not only the number printed in the formula.','Quelle, Bioverfügbarkeit und Antagonisten berücksichtigen — nicht nur die Zahl in der Formel.']
      ],
      challenges:['Bioavailability','Feed efficiency','Immune system','Low growth rate','Growth & disease control']
    },
    Aqua:{
      kicker:'AQUACULTURE NUTRITION',
      title:[ 'Functional nutrition for modern aquafeed.', 'Funktionelle Ernährung für modernes Aquafutter.' ],
      intro:[ 'Explore premix and additive options for nutrient utilization, feed processing, growth and consistent aquaculture performance.',
              'Entdecken Sie Premix- und Zusatzstoffoptionen für Nährstoffnutzung, Futterverarbeitung, Wachstum und konstante Aquakulturleistung.' ],
      hero:'aqua',
      symbol:'🐟',
      stages:[
        ['Premix foundation','Premix-Grundlage','Build a controlled micronutrient system matched to species, feed format and production targets.','Ein kontrolliertes Mikronährstoffsystem passend zu Tierart, Futterform und Produktionsziel aufbauen.'],
        ['Nutrient availability','Nährstoffverfügbarkeit','Use formulation and functional tools to support efficient access to nutrients.','Formulierung und funktionelle Werkzeuge nutzen, um den effizienten Zugang zu Nährstoffen zu unterstützen.'],
        ['Feed consistency','Futterkonstanz','Connect raw materials, processing and additive strategy around stable commercial feed performance.','Rohstoffe, Verarbeitung und Zusatzstoffstrategie für stabile kommerzielle Futterleistung verbinden.']
      ],
      challenges:['Feed efficiency','Bioavailability','Low growth rate','Growth & disease control']
    }
  }[species]||{};
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const host=document.getElementById('speciesPage');
  if(!host)return;
  const products=PRODUCTS.filter(p=>(p.species||[]).includes(species));
  const challengeCards=(config.challenges||[]).map((ch,i)=>{
    const count=products.filter(p=>(p.solutions||[]).includes(ch)).length;
    return '<a class="species-challenge-card reveal" href="products.html?species='+encodeURIComponent(species)+'&solution='+encodeURIComponent(ch)+'&lang='+lang+'"><span>0'+(i+1)+'</span><h3>'+esc(ch)+'</h3><p>'+count+' '+c('mapped products','zugeordnete Produkte')+'</p><b>↗</b></a>';
  }).join('');
  const stageCards=(config.stages||[]).map((s,i)=>'<article class="species-stage reveal"><span class="stage-index">0'+(i+1)+'</span><h3>'+esc(s[lang==='de'?1:0])+'</h3><p>'+esc(s[lang==='de'?3:2])+'</p></article>').join('');
  const bagFor=p=>{const id=(p.id||'').toLowerCase(),cat=(p.category||'').toLowerCase();if(/bre-fe-amino|bre-zn-amino/.test(id)||cat.includes('mineral'))return 'assets/images/bag-yellow.webp';if((p.type||'').toLowerCase().includes('premix')||/bremax-200|fishmix/.test(id))return 'assets/images/bag-squares.webp';if(/bremax-1002|bremax-1003|rode-egg/.test(id))return 'assets/images/bag-feather.webp';return 'assets/images/bag-wave.webp'};
  const toneFor=p=>{const type=(p.type||'').toLowerCase(),cat=(p.category||'').toLowerCase(),sp=(p.species||[]).join(' ').toLowerCase();if(type.includes('premix'))return 'product-tone-premix';if(cat.includes('mineral'))return 'product-tone-mineral';if(sp.includes('aqua')||(p.id||'').toLowerCase().includes('fish'))return 'product-tone-aqua';return 'product-tone-additive'};
  const productCards=products.slice(0,8).map(p=>'<a class="species-product reveal" href="product.html?id='+encodeURIComponent(p.id)+'&lang='+lang+'"><div class="species-product-visual '+toneFor(p)+'"><img class="species-bag-art" src="'+bagFor(p)+'" alt="'+esc(p.name)+' packaging"></div><div class="species-product-copy"><small>'+esc(p.type)+'</small><h3>'+esc(p.name)+'</h3><p>'+esc(p.summary?.[lang]||p.summary?.en||'')+'</p><b>'+c('View product','Produkt ansehen')+' ↗</b></div></a>').join('');
  host.innerHTML=
    '<section class="species-hero '+config.hero+'"><div class="species-hero-photo" aria-hidden="true"></div><div class="container species-hero-grid"><div class="species-hero-copy reveal in-view"><div class="eyebrow">BREGAN · '+config.kicker+'</div><h1>'+esc(config.title[lang==='de'?1:0])+'</h1><p>'+esc(config.intro[lang==='de'?1:0])+'</p><div class="hero-actions"><a class="btn btn-orange" href="products.html?species='+encodeURIComponent(species)+'&lang='+lang+'">'+c('Explore products','Produkte entdecken')+'</a><button class="btn btn-ghost" data-open-navigator>'+c('Find a solution','Lösung finden')+'</button></div><div class="species-hero-meta"><div><strong>'+products.length+'</strong><span>'+c('mapped products','zugeordnete Produkte')+'</span></div><div><strong>'+config.challenges.length+'</strong><span>'+c('challenge routes','Problemrouten')+'</span></div></div></div></div></section>'+
    '<section class="species-challenges section"><div class="container"><div class="section-heading reveal"><div class="eyebrow">'+c('Start with the challenge','Mit der Herausforderung beginnen')+'</div><h2>'+c('Different production problems need different routes.','Unterschiedliche Produktionsprobleme brauchen unterschiedliche Wege.')+'</h2><p>'+c('Choose the challenge first and narrow the Bregan portfolio from there.','Wählen Sie zuerst die Herausforderung und grenzen Sie das Bregan-Portfolio von dort aus ein.')+'</p></div><div class="species-challenge-grid">'+challengeCards+'</div></div></section>'+
    '<section class="species-stages"><div class="container"><div class="species-stage-intro reveal"><div class="eyebrow">'+c('Nutrition by stage','Ernährung nach Phase')+'</div><h2>'+c('The same animal. Different nutritional priorities.','Dasselbe Tier. Unterschiedliche Ernährungsprioritäten.')+'</h2></div><div class="species-stage-grid">'+stageCards+'</div></div></section>'+
    '<section class="species-products section"><div class="container"><div class="section-heading reveal"><div class="eyebrow">'+c('Relevant portfolio','Relevantes Portfolio')+'</div><h2>'+c('Products mapped to this species.','Produkte für diese Tierart.')+'</h2></div><div class="species-product-grid">'+productCards+'</div><div class="species-all-cta"><a class="btn btn-orange" href="products.html?species='+encodeURIComponent(species)+'&lang='+lang+'">'+c('See all matching products','Alle passenden Produkte ansehen')+'</a></div></div></section>'+
    '<section class="species-final"><div class="container species-final-box reveal"><div><span class="eyebrow">'+c('Need formulation support?','Formulierungsunterstützung benötigt?')+'</span><h2>'+c('Bring the current formula, target and challenge.','Bringen Sie aktuelle Formel, Ziel und Herausforderung mit.')+'</h2><p>'+c('Bregan can route the inquiry from species and formulation need toward the relevant product and commercial path.','Bregan kann die Anfrage von Tierart und Formulierungsbedarf zum passenden Produkt und kommerziellen Weg führen.')+'</p></div><button class="btn btn-navy" data-open-quote>'+c('Talk to Bregan','Mit Bregan sprechen')+'</button></div></section>';
  document.title=(config.title[lang==='de'?1:0]||species)+' | Bregan B.V.';
})();