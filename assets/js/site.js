(() => {
  let T = window.BREGAN_TRANSLATIONS || {en:{},de:{}};
  let PRODUCTS = window.BREGAN_PRODUCTS || [];
  let PAGE_OVERRIDES = [];
  const CMS_URL='https://bblhnlkqalgnxeesdjgh.supabase.co';
  const CMS_KEY='sb_publishable_TNm4y3FxI_jMngStlTse2g_J_SUuW6h';

  async function hydrateCms(){
    try{
      const headers={apikey:CMS_KEY};
      const cmsLang=new URLSearchParams(location.search).get('lang')||localStorage.getItem('breganLang')||'en';
      const cmsPage=location.pathname.split('/').pop()||'index.html';
      const [pr,cr,sr,orr]=await Promise.all([
        fetch(CMS_URL+'/rest/v1/products?select=*&status=eq.published&order=sort_order.asc,name.asc',{headers}),
        fetch(CMS_URL+'/rest/v1/content_entries?select=key,value&status=eq.published',{headers}),
        fetch(CMS_URL+'/rest/v1/site_settings?select=key,value&key=eq.visuals',{headers}),
        fetch(CMS_URL+'/rest/v1/page_overrides?select=selector,lang,kind,value&status=eq.published&page=eq.'+encodeURIComponent(cmsPage)+'&or=(lang.eq.'+cmsLang+',lang.eq.all)',{headers})
      ]);
      if(pr.ok){
        const rows=await pr.json();
        if(Array.isArray(rows)&&rows.length){
          PRODUCTS=rows.map(p=>({...p,image:p.image_url||p.image||null}));
          window.BREGAN_PRODUCTS=PRODUCTS;
        }
      }
      if(cr.ok){
        const rows=await cr.json();
        const merged={en:{...(T.en||{})},de:{...(T.de||{})}};
        rows.forEach(x=>{if(x?.key&&x?.value){if(x.value.en!==undefined)merged.en[x.key]=x.value.en;if(x.value.de!==undefined)merged.de[x.key]=x.value.de}});
        T=merged; window.BREGAN_TRANSLATIONS=T;
      }
      if(orr.ok){
        const rows=await orr.json();
        PAGE_OVERRIDES=Array.isArray(rows)?rows:[];
      }
      if(sr.ok){
        const rows=await sr.json(); const v=rows?.[0]?.value||{};
        if(Object.keys(v).length){
          const safe=u=>String(u||'').replace(/["'()]/g,'');
          const style=document.createElement('style');style.id='cmsVisualOverrides';
          style.textContent=`
            .hero-bg{background-image:url("${safe(v.hero)}")!important}
            .page-hero:before{background-image:url("${safe(v.page_hero||v.hero)}")!important}
            .species-card.poultry{--bg:url("${safe(v.poultry)}")!important}
            .species-card.ruminant{--bg:url("${safe(v.ruminant)}")!important}
            .species-card.aqua{--bg:url("${safe(v.aqua)}")!important}
            .species-card.feedmills{--bg:url("${safe(v.feedmills)}")!important}
            .journey-photo{background-image:url("${safe(v.journey||v.hero)}")!important}
            .explore-tile:nth-child(1):before{background-image:url("${safe(v.explore_1||v.poultry)}")!important}
            .explore-tile:nth-child(2):before{background-image:url("${safe(v.explore_2||v.ruminant)}")!important}
            .explore-tile:nth-child(3):before{background-image:url("${safe(v.explore_3||v.aqua)}")!important}
            .story-art{background-image:linear-gradient(180deg,rgba(9,34,54,.10),rgba(9,34,54,.76)),url("${safe(v.story_factory||v.feedmills)}")!important}
            .species-hero.poultry .species-hero-photo{background-image:url("${safe(v.poultry)}")!important}
            .species-hero.ruminant .species-hero-photo{background-image:url("${safe(v.ruminant)}")!important}
            .species-hero.aqua .species-hero-photo{background-image:url("${safe(v.aqua)}")!important}
          `;
          document.head.appendChild(style);
        }
      }
    }catch(err){console.warn('Bregan CMS fallback active',err)}
  }
  const state = { lang: new URLSearchParams(location.search).get('lang') || localStorage.getItem('breganLang') || 'en' };
  if (!['en','de'].includes(state.lang)) state.lang = 'en';
  const page = document.body.dataset.page || 'home';
  const tr = key => T[state.lang]?.[key] ?? T.en[key] ?? key;
  const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const withLang = href => { const u = new URL(href, location.href); u.searchParams.set('lang', state.lang); return u.pathname.split('/').pop() + '?' + u.searchParams.toString() + (u.hash || ''); };

  function applyPageOverrides(){
    const rows=[...PAGE_OVERRIDES].sort((a,b)=>(a.lang==='all'?0:1)-(b.lang==='all'?0:1));
    rows.forEach(o=>{
      if(!o?.selector||o.kind!=='text')return;
      try{
        const el=document.querySelector(o.selector);
        if(el) el.textContent=o.value ?? '';
      }catch(_){}
    });
  }

  function header(){
    const active=name=>page===name?' is-active':'';
    return `<div class="scroll-progress" id="scrollProgress"></div><header class="site-header" id="siteHeader"><a class="brand" href="${withLang('index.html')}" aria-label="Bregan home"><img class="brand-logo-image" src="assets/images/bregan-logo.webp?v=4" alt="Bregan — a Dutch Animal Nutrition Company"></a><nav class="desktop-nav" aria-label="Primary"><a class="${active('home')}" href="${withLang('index.html')}" data-i18n="nav_home">${tr('nav_home')}</a><a class="${active('products')}" href="${withLang('products.html')}" data-i18n="nav_products">${tr('nav_products')}</a><a class="${active('solutions')}" href="${withLang('solutions.html')}" data-i18n="nav_solutions">${tr('nav_solutions')}</a><a class="${active('about')}" href="${withLang('about.html')}" data-i18n="nav_about">${tr('nav_about')}</a><a class="${active('insights')}" href="${withLang('insights.html')}">${state.lang==='de'?'Wissen':'Insights'}</a><a class="${active('contact')}" href="${withLang('contact.html')}" data-i18n="nav_contact">${tr('nav_contact')}</a></nav><div class="header-actions"><div class="lang-switch" aria-label="Language"><button type="button" data-lang-select="en" class="${state.lang==='en'?'active':''}">EN</button><span>/</span><button type="button" data-lang-select="de" class="${state.lang==='de'?'active':''}">DE</button></div><button class="btn btn-orange btn-sm desktop-quote" data-open-quote data-i18n="quote">${tr('quote')}</button><button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button></div></header><div class="mobile-panel" id="mobilePanel" aria-hidden="true"><nav><a href="${withLang('index.html')}">${tr('nav_home')}</a><a href="${withLang('products.html')}">${tr('nav_products')}</a><a href="${withLang('solutions.html')}">${tr('nav_solutions')}</a><a href="${withLang('about.html')}">${tr('nav_about')}</a><a href="${withLang('insights.html')}">${state.lang==='de'?'Wissen':'Insights'}</a><a href="${withLang('contact.html')}">${tr('nav_contact')}</a><button class="btn btn-orange" data-open-quote>${tr('quote')}</button></nav></div>`;
  }

  function footer(){
    return `<footer class="site-footer"><div class="footer-grid container"><div class="footer-brand"><div class="brand brand-footer"><img class="brand-logo-image brand-logo-image-footer" src="assets/images/bregan-logo.webp?v=4" alt="Bregan — a Dutch Animal Nutrition Company"></div><p>${tr('footer_blurb')}</p><div class="footer-chip">a Dutch Animal Nutrition Company</div></div><div><h4>${tr('footer_links')}</h4><a href="${withLang('products.html')}">${tr('nav_products')}</a><a href="${withLang('solutions.html')}">${tr('nav_solutions')}</a><a href="${withLang('about.html')}">${tr('nav_about')}</a><a href="${withLang('insights.html')}">${state.lang==='de'?'Wissen':'Insights'}</a></div><div><h4>${tr('footer_contact')}</h4><a href="mailto:info@bregan.nl">info@bregan.nl</a><p>${tr('footer_address')}</p></div><div class="footer-cta"><p>${state.lang==='de'?'Bereit für die nächste Futterlösung?':'Ready for your next feed solution?'}</p><button class="btn btn-orange" data-open-quote>${tr('quote')}</button></div></div><div class="footer-bottom container"><span>© ${new Date().getFullYear()} Bregan B.V.</span><a href="${withLang('privacy.html')}">${state.lang==='de'?'Datenschutz':'Privacy'}</a><span>Breda · The Netherlands</span></div></footer>`;
  }

  function formMarkup(id){
    const speciesOptions=['Poultry','Ruminants','Aquaculture','Feed mill / Manufacturer','Other'];
    const documentOptions=state.lang==='de'?['Technische Spezifikation','COA / Analysezertifikat','Produktbroschüre','Preis / Angebot','Registrierungs- oder Etiketteninformationen','Sonstiges']:['Technical specification','COA / Certificate of Analysis','Product brochure','Price / quotation','Registration or label information','Other'];
    return `<form class="inquiry-form" id="${id}" novalidate><div class="form-grid"><label><span>${tr('form_company')} *</span><input name="company" required autocomplete="organization"></label><label><span>${tr('form_name')} *</span><input name="name" required autocomplete="name"></label><label><span>${tr('form_email')} *</span><input name="email" type="email" required autocomplete="email"></label><label><span>${tr('form_phone')}</span><input name="phone" autocomplete="tel"></label><label><span>${state.lang==='de'?'Ihr Land':'Your country'}</span><input name="country" autocomplete="country-name"></label><label><span>${state.lang==='de'?'Zielmarkt':'Target market'}</span><input name="targetMarket" placeholder="${state.lang==='de'?'z. B. Deutschland, Kenia, Bangladesch':'e.g. Germany, Kenya, Bangladesh'}"></label><label><span>${state.lang==='de'?'Tierart / Bereich':'Species / segment'}</span><select name="species"><option value="">${state.lang==='de'?'Auswählen':'Select'}</option>${speciesOptions.map(x=>`<option>${x}</option>`).join('')}</select></label><label><span>${tr('form_product')}</span><input name="product"></label><label><span>${state.lang==='de'?'Geschätzte Menge':'Estimated quantity'}</span><input name="quantity" placeholder="${state.lang==='de'?'z. B. 5 t / Monat':'e.g. 5 MT / month'}"></label><label><span>${state.lang==='de'?'Benötigte Unterlagen':'Documents needed'}</span><select name="documents"><option value="">${state.lang==='de'?'Auswählen':'Select'}</option>${documentOptions.map(x=>`<option>${x}</option>`).join('')}</select></label><label class="form-full"><span>${tr('form_message')} *</span><textarea name="message" rows="5" required></textarea></label></div><div class="form-context-note">${state.lang==='de'?'Je mehr Kontext Sie zu Tierart, Markt, Menge und Anwendung geben, desto schneller kann die Anfrage intern zugeordnet werden.':'The more context you provide on species, market, quantity and application, the faster the inquiry can be routed internally.'}</div><label class="check-row"><input type="checkbox" name="privacy" required><span>${tr('form_privacy')}</span></label><p class="form-error" aria-live="polite"></p><button class="btn btn-orange btn-wide" type="submit">${tr('form_send')} <span aria-hidden="true">↗</span></button></form>`;
  }

  function quoteModal(){
    return `<div class="modal" id="quoteModal" aria-hidden="true" role="dialog" aria-modal="true"><div class="modal-backdrop" data-close-quote></div><div class="modal-card"><button class="modal-close" data-close-quote aria-label="Close">×</button><div class="eyebrow">BREGAN · ${state.lang==='de'?'ANFRAGE':'INQUIRY'}</div><h2>${tr('quote')}</h2><p>${state.lang==='de'?'Teilen Sie uns kurz Ihr Ziel mit. Wir bereiten eine strukturierte E-Mail an unser Team vor.':'Tell us what you need. We will prepare a structured email to our team.'}</p>${formMarkup('quoteForm')}</div></div>`;
  }

  function injectShell(){document.querySelector('main')?.setAttribute('id','main-content');document.body.insertAdjacentHTML('afterbegin',`<a class="skip-link" href="#main-content">${state.lang==='de'?'Zum Inhalt':'Skip to content'}</a>`);document.getElementById('site-header')?.insertAdjacentHTML('afterbegin',header());document.getElementById('site-footer')?.insertAdjacentHTML('afterbegin',footer());document.body.insertAdjacentHTML('beforeend',quoteModal());}
  function applyLanguage(){document.documentElement.lang=state.lang;document.querySelectorAll('[data-i18n]').forEach(el=>{const v=T[state.lang]?.[el.dataset.i18n];if(v)el.textContent=v});document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{const v=T[state.lang]?.[el.dataset.i18nPlaceholder];if(v)el.placeholder=v});document.querySelectorAll('[data-lang-select]').forEach(b=>b.classList.toggle('active',b.dataset.langSelect===state.lang));}
  function switchLang(lang){localStorage.setItem('breganLang',lang);const u=new URL(location.href);u.searchParams.set('lang',lang);location.href=u.toString();}
  function openQuote(product=''){const m=document.getElementById('quoteModal');if(!m)return;m.classList.add('open');m.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');const i=m.querySelector('[name="product"]');if(i&&product)i.value=product;setTimeout(()=>m.querySelector('input')?.focus(),50)}
  function closeQuote(){const m=document.getElementById('quoteModal');if(!m)return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}

  function setupNavigation(){
    document.querySelectorAll('.desktop-nav .is-active').forEach(a=>a.setAttribute('aria-current','page'));
    document.addEventListener('click',e=>{const l=e.target.closest('[data-lang-select]');if(l)switchLang(l.dataset.langSelect);const o=e.target.closest('[data-open-quote]');if(o)openQuote(o.dataset.product||'');if(e.target.closest('[data-close-quote]'))closeQuote()});
    const t=document.getElementById('menuToggle'),p=document.getElementById('mobilePanel');t?.addEventListener('click',()=>{const x=p.classList.toggle('open');t.classList.toggle('open',x);t.setAttribute('aria-expanded',String(x));p.setAttribute('aria-hidden',String(!x));document.body.classList.toggle('menu-open',x)});
  }

  function showMailFallback(subject,body){let p=document.getElementById('mailFallback');if(!p){p=document.createElement('div');p.id='mailFallback';p.className='mail-fallback';document.body.appendChild(p)}p.innerHTML=`<button class="mail-close">×</button><h3>${tr('mail_ready')}</h3><p>${tr('mail_ready_text')}</p><div class="mail-to">info@bregan.nl</div><textarea readonly>${esc(subject+'\n\n'+body)}</textarea><button class="btn btn-navy" data-copy-mail>${tr('copy_message')}</button>`;p.classList.add('show');p.querySelector('.mail-close').onclick=()=>p.classList.remove('show');p.querySelector('[data-copy-mail]').onclick=async e=>{await navigator.clipboard.writeText(subject+'\n\n'+body);e.currentTarget.textContent=tr('copied')}}

  function setupForms(){
    document.querySelectorAll('.inquiry-form').forEach(form=>{
      if(form.dataset.ready)return;
      form.dataset.ready='1';
      form.addEventListener('submit',async e=>{
        e.preventDefault();
        const er=form.querySelector('.form-error');
        if(!form.checkValidity()){er.textContent=tr('form_required');form.reportValidity();return}
        er.textContent='';
        const d=Object.fromEntries(new FormData(form).entries());
        const payload={
          company:d.company||null,name:d.name||'',email:d.email||'',phone:d.phone||null,country:d.country||null,
          target_market:d.targetMarket||null,species:d.species||null,product:d.product||null,quantity:d.quantity||null,
          documents:d.documents||null,message:d.message||'',status:'new'
        };
        try{
          const r=await fetch(CMS_URL+'/rest/v1/inquiries',{
            method:'POST',
            headers:{apikey:CMS_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
            body:JSON.stringify(payload)
          });
          if(r.ok){
            form.reset();
            er.textContent=state.lang==='de'?'Vielen Dank. Ihre Anfrage wurde an das Bregan-Team gesendet.':'Thank you. Your inquiry has been sent to the Bregan team.';
            er.classList.add('success');
            return;
          }
        }catch(_){}
        const subject=`Bregan website inquiry — ${d.company||d.name}${d.product?' — '+d.product:''}`;
        const body=['BREGAN WEBSITE INQUIRY','',`Company: ${d.company||'-'}`,`Name: ${d.name||'-'}`,`Email: ${d.email||'-'}`,`Phone: ${d.phone||'-'}`,`Your country: ${d.country||'-'}`,`Target market: ${d.targetMarket||'-'}`,`Species / segment: ${d.species||'-'}`,`Product / interest: ${d.product||'-'}`,`Estimated quantity: ${d.quantity||'-'}`,`Documents needed: ${d.documents||'-'}`,'','Message:',d.message||'-'].join('\n');
        showMailFallback(subject,body);
      })
    })
  }

  function setupSeo(){
    const file=location.pathname.split('/').pop()||'index.html';
    const basePath=location.pathname.slice(0,location.pathname.lastIndexOf('/')+1);
    const baseUrl=location.origin+basePath;
    const descriptions={
      'index.html':state.lang==='de'?'Bregan B.V. ist ein niederländisches Unternehmen für Tierernährung mit Premixen, Futterzusätzen und internationalen Futterlösungen.':'Bregan B.V. is a Dutch animal nutrition company for premixes, feed additives and international feed solutions.',
      'products.html':state.lang==='de'?'Entdecken Sie Bregan Premixe und Spezialfutterzusätze für Geflügel, Aquakultur und Wiederkäuer.':'Explore Bregan premixes and specialty feed additives for poultry, aquaculture and ruminants.',
      'solutions.html':state.lang==='de'?'Bregan Futterlösungen nach Tierart, Produktionsherausforderung und Anwendung.':'Bregan feed solutions organized by species, production challenge and application.',
      'about.html':state.lang==='de'?'Erfahren Sie mehr über Bregan B.V., ein niederländisches Tierernährungsunternehmen mit Sitz in Breda.':'Learn about Bregan B.V., a Dutch animal nutrition company based in Breda.',
      'insights.html':state.lang==='de'?'Praktische Einblicke in Tierernährung, Futtereffizienz, Futtermittelsicherheit und Formulierung.':'Practical insights on animal nutrition, feed efficiency, feed safety and formulation.',
      'contact.html':state.lang==='de'?'Kontaktieren Sie Bregan B.V. für Produktinformationen, technische Unterlagen und Angebote.':'Contact Bregan B.V. for product information, technical documents and quotations.',
      'poultry.html':state.lang==='de'?'Bregan Lösungen für Broiler und Legehennen: Premixe, Enzyme, Darmgesundheit, Toxinkontrolle und Futtereffizienz.':'Bregan poultry solutions for broilers and layers: premixes, enzymes, gut health, toxin control and feed efficiency.',
      'ruminants.html':state.lang==='de'?'Bregan Ernährungslösungen für Milch- und Mastrinder mit Fokus auf Nutzung, Mineralstoffe und konstante Leistung.':'Bregan ruminant nutrition solutions for dairy and beef with focus on utilization, minerals and consistent performance.',
      'aquaculture.html':state.lang==='de'?'Bregan Premixe und funktionelle Futterzusätze für moderne Aquakultur und Aquafutter.':'Bregan premixes and functional feed additives for modern aquaculture and aquafeed.',
      'privacy.html':state.lang==='de'?'Datenschutzhinweise für die Bregan B.V. Website.':'Privacy information for the Bregan B.V. website.'
    };
    let description=descriptions[file]||document.querySelector('meta[name="description"]')?.content||'Bregan B.V.';
    if(file==='product.html'){
      description=document.querySelector('.detail-copy .lead')?.textContent?.trim()||description;
    }
    const ensureMeta=(selector,attrs)=>{
      let el=document.head.querySelector(selector);
      if(!el){el=document.createElement('meta');document.head.appendChild(el);}
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
      return el;
    };
    const canonicalParams=new URLSearchParams();
    canonicalParams.set('lang',state.lang);
    if(file==='product.html'){
      const id=new URLSearchParams(location.search).get('id');
      if(id)canonicalParams.set('id',id);
    }
    const canonical=baseUrl+file+'?'+canonicalParams.toString();
    let link=document.head.querySelector('link[rel="canonical"]');
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}
    link.href=canonical;
    ['en','de'].forEach(code=>{
      let alt=document.head.querySelector('link[rel="alternate"][hreflang="'+code+'"]');
      if(!alt){alt=document.createElement('link');alt.rel='alternate';alt.hreflang=code;document.head.appendChild(alt);}
      const q=new URLSearchParams(canonicalParams);q.set('lang',code);alt.href=baseUrl+file+'?'+q.toString();
    });
    let xd=document.head.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if(!xd){xd=document.createElement('link');xd.rel='alternate';xd.hreflang='x-default';document.head.appendChild(xd);}
    const xq=new URLSearchParams(canonicalParams);xq.set('lang','en');xd.href=baseUrl+file+'?'+xq.toString();
    const title=document.title;
    const logo=baseUrl+'assets/images/bregan-logo.webp?v=4';
    ensureMeta('meta[name="description"]',{name:'description',content:description});
    ensureMeta('meta[name="robots"]',{name:'robots',content:file==='404.html'?'noindex,follow':'index,follow,max-image-preview:large'});
    ensureMeta('meta[property="og:title"]',{property:'og:title',content:title});
    ensureMeta('meta[property="og:description"]',{property:'og:description',content:description});
    ensureMeta('meta[property="og:type"]',{property:'og:type',content:file==='product.html'?'product':'website'});
    ensureMeta('meta[property="og:url"]',{property:'og:url',content:canonical});
    ensureMeta('meta[property="og:image"]',{property:'og:image',content:logo});
    ensureMeta('meta[property="og:site_name"]',{property:'og:site_name',content:'Bregan B.V.'});
    ensureMeta('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    ensureMeta('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    ensureMeta('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    ensureMeta('meta[name="twitter:image"]',{name:'twitter:image',content:logo});
    if(file==='index.html'&&!document.getElementById('breganStructuredData')){
      const ld=document.createElement('script');ld.type='application/ld+json';ld.id='breganStructuredData';
      ld.textContent=JSON.stringify({
        '@context':'https://schema.org','@type':'Organization',
        name:'Bregan B.V.',url:'https://www.bregan.nl/',email:'info@bregan.nl',
        address:{'@type':'PostalAddress',streetAddress:'Smederijstraat 2',postalCode:'4814 DB',addressLocality:'Breda',addressCountry:'NL'},
        description:descriptions['index.html']
      });
      document.head.appendChild(ld);
    }
  }

  function setupMotion(){const obs=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)x.target.classList.add('in-view')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));const h=document.getElementById('siteHeader');addEventListener('scroll',()=>{h?.classList.toggle('scrolled',scrollY>20);const max=document.documentElement.scrollHeight-innerHeight,b=document.getElementById('scrollProgress');if(b)b.style.width=`${max?(scrollY/max)*100:0}%`},{passive:true})}

  function bagAsset(p){
    const id=(p.id||'').toLowerCase();
    const cat=(p.category||'').toLowerCase();
    if(/bre-fe-amino|bre-zn-amino/.test(id)||cat.includes('mineral')) return 'assets/images/bag-yellow.webp';
    if((p.type||'').toLowerCase().includes('premix')||/bremax-200|fishmix/.test(id)) return 'assets/images/bag-squares.webp';
    if(/bremax-1002|bremax-1003|rode-egg/.test(id)) return 'assets/images/bag-feather.webp';
    return 'assets/images/bag-wave.webp';
  }
  function productTone(p){
    const type=(p.type||'').toLowerCase();
    const cat=(p.category||'').toLowerCase();
    const species=(p.species||[]).join(' ').toLowerCase();
    if(type.includes('premix')) return 'product-tone-premix';
    if(cat.includes('mineral')) return 'product-tone-mineral';
    if(species.includes('aqua') || (p.id||'').toLowerCase().includes('fish')) return 'product-tone-aqua';
    return 'product-tone-additive';
  }
  function productVisual(p){
    const bag=p.image||bagAsset(p);
    const imageClass=p.image?'brand-bag-photo official-product-photo':'brand-bag-photo';
    return `<div class="product-visual branded-bag-visual ${productTone(p)}"><img class="${imageClass}" src="${bag}" alt="${esc(p.name)} packaging" loading="lazy"></div>`;
  }
  function productCard(p){return `<article class="product-card reveal">${productVisual(p)}<div class="product-card-body"><div class="product-meta"><span>${esc(p.type)}</span><span>${esc(p.species[0])}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.summary[state.lang])}</p><div class="product-tags">${p.solutions.slice(0,2).map(s=>`<span>${esc(s)}</span>`).join('')}</div><div class="product-card-actions"><a class="text-link" href="product.html?id=${encodeURIComponent(p.id)}&lang=${state.lang}">${tr('view_product')} <b>↗</b></a><button class="compare-toggle" type="button" data-compare-product="${esc(p.id)}">${state.lang==='de'?'Vergleichen':'Compare'}</button></div></div></article>`}
  function renderFeatured(){const w=document.getElementById('featuredProducts');if(!w)return;const ids=['bretox','bregrowth-perfection','bremax-1002','brenzyme-phos','fishmix','bre-zn-amino'];w.innerHTML=ids.map(id=>productCard(PRODUCTS.find(p=>p.id===id))).join('')}

  function renderProductFinder(){const g=document.getElementById('productGrid');if(!g)return;const search=document.getElementById('productSearch'),species=document.getElementById('speciesFilter'),type=document.getElementById('typeFilter'),solution=document.getElementById('solutionFilter');const fill=(el,v)=>el.innerHTML=`<option value="">${tr('all')}</option>`+[...new Set(v)].sort().map(x=>`<option>${esc(x)}</option>`).join('');fill(species,PRODUCTS.flatMap(p=>p.species));fill(type,PRODUCTS.map(p=>p.type));fill(solution,PRODUCTS.flatMap(p=>p.solutions));const qp=new URLSearchParams(location.search);if(qp.get('species'))species.value=qp.get('species');if(qp.get('type'))type.value=qp.get('type');if(qp.get('solution'))solution.value=qp.get('solution');if(qp.get('q'))search.value=qp.get('q');search.placeholder=tr('search_placeholder');function update(){const q=(search.value||'').trim().toLowerCase();const items=PRODUCTS.filter(p=>(!q||[p.name,p.category,p.type,p.summary.en,p.summary.de,...p.solutions,...p.species].join(' ').toLowerCase().includes(q))&&(!species.value||p.species.includes(species.value))&&(!type.value||p.type===type.value)&&(!solution.value||p.solutions.includes(solution.value)));g.innerHTML=items.map(productCard).join('')||`<div class="empty-state">${state.lang==='de'?'Keine Produkte entsprechen diesen Filtern.':'No products match these filters.'}</div>`;document.getElementById('productCount').textContent=`${items.length} ${tr('results')}`;document.querySelectorAll('#productGrid .reveal').forEach(el=>el.classList.add('in-view'))} [search,species,type,solution].forEach(el=>el.addEventListener(el===search?'input':'change',update));document.getElementById('resetFilters')?.addEventListener('click',()=>{search.value='';species.value='';type.value='';solution.value='';update()});update()}

  function renderProductDetail(){
    const w=document.getElementById('productDetail');if(!w)return;
    const id=new URLSearchParams(location.search).get('id')||PRODUCTS[0]?.id;
    const p=PRODUCTS.find(x=>x.id===id)||PRODUCTS[0];
    document.title=`${p.name} | Bregan B.V.`;
    const related=PRODUCTS.filter(x=>x.id!==p.id&&((x.species||[]).some(s=>(p.species||[]).includes(s))||x.category===p.category)).slice(0,3);
    const speciesLinks=(p.species||[]).map(s=>{
      const map={Poultry:'poultry.html',Ruminants:'ruminants.html',Aqua:'aquaculture.html'};
      return map[s]?`<a href="${map[s]}?lang=${state.lang}">${esc(s)} ↗</a>`:`<span>${esc(s)}</span>`;
    }).join('');
    const challengeLinks=(p.solutions||[]).map(s=>`<a href="products.html?solution=${encodeURIComponent(s)}&lang=${state.lang}">${esc(s)}</a>`).join('');
    const relatedCards=related.map(x=>`<a class="related-product-card" href="product.html?id=${encodeURIComponent(x.id)}&lang=${state.lang}">${productVisual(x)}<div><small>${esc(x.type)}</small><h3>${esc(x.name)}</h3><p>${esc(x.summary[state.lang]||x.summary.en||'')}</p><b>${state.lang==='de'?'Produkt öffnen':'Open product'} ↗</b></div></a>`).join('');
    w.innerHTML=`<div class="product-detail-hero container"><div class="detail-copy reveal in-view"><a class="back-link" href="products.html?lang=${state.lang}">← ${tr('detail_back')}</a><div class="eyebrow">${esc(p.type)} · ${esc(p.category)}</div><h1>${esc(p.name)}</h1><p class="lead">${esc(p.summary[state.lang])}</p><p>${esc(p.description[state.lang])}</p><div class="detail-species-links">${speciesLinks}</div><div class="hero-actions"><button class="btn btn-orange" data-open-quote data-product="${esc(p.name)}">${tr('technical_info')}</button><a class="btn btn-ghost" href="contact.html?lang=${state.lang}&product=${encodeURIComponent(p.name)}">${tr('talk_expert')}</a></div></div><div class="detail-visual reveal in-view"><div class="detail-visual-stage">${productVisual(p)}</div><div class="detail-chip-row"><span class="detail-float-chip">${esc(p.consistency||'')}</span><span class="detail-float-chip">${esc(p.packaging||'')}</span><span class="detail-float-chip">${esc((p.species||[])[0]||'')}</span></div></div></div>
    <section class="detail-specs section"><div class="container specs-grid">${[[tr('product_type'),p.type],[tr('product_category'),p.category],[tr('product_species'),p.species.join(' · ')],[tr('product_consistency'),p.consistency],[tr('product_packaging'),p.packaging],[tr('product_inclusion'),p.inclusion]].map(([k,v])=>`<div class="spec"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section>
    <section class="section product-story-section"><div class="container product-story-grid"><div class="reveal"><div class="eyebrow">${tr('product_benefits')}</div><h2>${state.lang==='de'?'Für praktische Anwendung entwickelt.':'Built for practical application.'}</h2><ul class="check-list">${p.benefits[state.lang].map(x=>`<li><span>✓</span>${esc(x)}</li>`).join('')}</ul></div><div class="composition-card reveal"><span>${tr('product_composition')}</span><p>${esc(p.composition[state.lang])}</p><small>${state.lang==='de'?'Für Einsatzrate, aktuelle Spezifikation und regulatorische Eignung kontaktieren Sie bitte unser technisches Team.':'For inclusion rate, current specification and regulatory suitability, please contact our technical team.'}</small></div></div></section>
    <section class="application-map"><div class="container"><div class="section-heading reveal"><div class="eyebrow">${state.lang==='de'?'ANWENDUNGSKARTE':'APPLICATION MAP'}</div><h2>${state.lang==='de'?'Wo dieses Produkt ins Gespräch passt.':'Where this product enters the conversation.'}</h2><p>${state.lang==='de'?'Nutzen Sie die Themen als Einstiegspunkte zur Produktauswahl; die finale Anwendung hängt von Tierart, Rezeptur, Markt und Ziel ab.':'Use these themes as product-selection entry points; final application depends on species, formulation, market and target.'}</p></div><div class="application-tags reveal">${challengeLinks}</div></div></section>
    <section class="document-callout"><div class="container document-callout-box reveal"><div><div class="eyebrow">${state.lang==='de'?'TECHNISCHE UNTERLAGEN':'TECHNICAL DOCUMENTS'}</div><h2>${state.lang==='de'?'Benötigen Sie Spezifikation, COA oder technische Details?':'Need specification, COA or technical details?'}</h2><p>${state.lang==='de'?'Senden Sie Produkt, Zielmarkt und Anwendung. Das Bregan-Team kann die passende technische und kommerzielle Dokumentation zuordnen.':'Send the product, target market and application. The Bregan team can route the relevant technical and commercial documentation.'}</p></div><button class="btn btn-orange" data-open-quote data-product="${esc(p.name)}">${state.lang==='de'?'Unterlagen anfordern':'Request documents'}</button></div></section>
    ${related.length?`<section class="related-products section"><div class="container"><div class="section-heading reveal"><div class="eyebrow">${state.lang==='de'?'WEITER ENTDECKEN':'KEEP EXPLORING'}</div><h2>${state.lang==='de'?'Verwandte Bregan-Produkte.':'Related Bregan products.'}</h2></div><div class="related-product-grid">${relatedCards}</div></div></section>`:''}`;
  }
  function setupContactPage(){const h=document.getElementById('contactFormHost');if(!h)return;h.innerHTML=formMarkup('contactForm');const product=new URLSearchParams(location.search).get('product');if(product)h.querySelector('[name="product"]').value=product}
  async function init(){await hydrateCms();injectShell();applyLanguage();setupNavigation();renderFeatured();renderProductFinder();renderProductDetail();setupContactPage();setupSeo();setupForms();setupMotion();applyPageOverrides();setTimeout(applyPageOverrides,350);setTimeout(applyPageOverrides,1100);addEventListener('keydown',e=>{if(e.key==='Escape')closeQuote()})}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();


/* BREGAN_EXPERIENCE_LOADER */
(() => { const s=document.createElement('script'); s.src='assets/js/experience.js'; s.defer=true; document.body.appendChild(s); })();
