(() => {
  const SUPABASE_URL='https://bblhnlkqalgnxeesdjgh.supabase.co';
  const SUPABASE_KEY='sb_publishable_TNm4y3FxI_jMngStlTse2g_J_SUuW6h';
  const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  const authView=document.getElementById('authView');
  const appView=document.getElementById('appView');
  const panel=document.getElementById('panel');
  const viewTitle=document.getElementById('viewTitle');
  const authMessage=document.getElementById('authMessage');
  let session=null, profile=null, currentView='dashboard';

  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const arr=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
  const lines=s=>String(s||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const txt=(v,lang='en')=>v?.[lang]||'';
  const allowed=(...roles)=>profile&&roles.includes(profile.role);
  const notice=(m)=>'<div class="notice">'+esc(m)+'</div>';
  const fmt=d=>d?new Date(d).toLocaleString():'—';

  async function uploadAsset(file,prefix='media'){
    if(!file)return null;
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');
    const path=prefix+'-'+Date.now()+'-'+safeName;
    const {error}=await db.storage.from('bregan-media').upload(path,file,{upsert:false,contentType:file.type||undefined});
    if(error)throw error;
    return db.storage.from('bregan-media').getPublicUrl(path).data.publicUrl;
  }

  async function getProfile(){
    const {data,error}=await db.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
    if(error) throw error;
    return data;
  }

  async function enterApp(){
    profile=await getProfile();
    if(!profile||!profile.active){
      authMessage.textContent='Your account exists but has not been activated for Bregan CMS.';
      await db.auth.signOut(); return;
    }
    authView.hidden=true; appView.hidden=false;
    document.getElementById('userEmail').textContent=profile.email||session.user.email;
    document.getElementById('roleBadge').textContent=profile.role.replaceAll('_',' ');
    document.querySelectorAll('#nav button').forEach(b=>b.disabled=false);
    if(profile.role==='viewer'){
      document.querySelectorAll('#nav button:not([data-view="dashboard"])').forEach(b=>b.disabled=true);
    }else if(profile.role==='sales'){
      ['siteEditor','pages','navigation','history','content','settings','team'].forEach(v=>document.querySelector('#nav [data-view="'+v+'"]')?.setAttribute('disabled',''));
    }else if(profile.role==='marketing'){
      document.querySelector('#nav [data-view="team"]')?.setAttribute('disabled','');
    }
    await render(currentView);
  }

  async function bootstrap(){
    const {data}=await db.auth.getSession();
    session=data.session;
    if(session) await enterApp();
  }

  document.getElementById('loginForm').addEventListener('submit',async e=>{
    e.preventDefault(); authMessage.textContent='Signing in…';
    const f=new FormData(e.currentTarget);
    const {data,error}=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});
    if(error){authMessage.textContent=error.message;return}
    session=data.session; authMessage.textContent='';
    await enterApp();
  });

  document.getElementById('logoutBtn').onclick=async()=>{await db.auth.signOut();location.reload()};
  document.getElementById('refreshBtn').onclick=()=>render(currentView);
  document.querySelectorAll('#nav button').forEach(b=>b.onclick=async()=>{
    if(b.disabled)return;
    document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x===b));
    currentView=b.dataset.view;
    await render(currentView);
  });
  document.addEventListener('click',e=>{if(e.target.closest('[data-close-modal]'))closeModal()});

  function openModal(html){document.getElementById('modalBody').innerHTML=html;document.getElementById('modal').hidden=false}
  function closeModal(){document.getElementById('modal').hidden=true;document.getElementById('modalBody').innerHTML=''}

  async function render(view){
    const titles={dashboard:'Dashboard',siteEditor:'Live site editor',pages:'Pages & builder',navigation:'Navigation & footer',history:'Version history',products:'Products',content:'All text fields',events:'Events',documents:'Documents',inquiries:'Inquiries',media:'Media library',team:'Team',settings:'Settings'};
    viewTitle.textContent=titles[view]||view;
    panel.innerHTML='<div class="card"><div class="empty">Loading…</div></div>';
    try{
      if(view==='dashboard') return renderDashboard();
      if(view==='siteEditor') return renderSiteEditor();
      if(view==='pages') return renderPages();
      if(view==='navigation') return renderNavigation();
      if(view==='history') return renderHistory();
      if(view==='products') return renderProducts();
      if(view==='content') return renderContent();
      if(view==='events') return renderEvents();
      if(view==='documents') return renderDocuments();
      if(view==='inquiries') return renderInquiries();
      if(view==='media') return renderMedia();
      if(view==='team') return renderTeam();
      if(view==='settings') return renderSettings();
    }catch(err){panel.innerHTML='<div class="card"><p class="danger-text">'+esc(err.message||err)+'</p></div>'}
  }



  function cmsClone(value){return JSON.parse(JSON.stringify(value??{}))}
  function cmsSlug(value){return String(value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
  function cmsPageHref(page,lang='en'){
    return page.page_kind==='custom'?'../page.html?slug='+encodeURIComponent(page.slug)+'&lang='+lang:'../'+page.source_file+'?lang='+lang;
  }
  async function cmsSaveRevision(entityType,entityKey,version,snapshot,note){
    const {error}=await db.from('cms_revisions').insert({
      entity_type:entityType,entity_key:entityKey,version,snapshot,note:note||null,actor_id:session.user.id
    });
    if(error)throw error;
  }
  async function cmsPublishPage(page,draftData,draftSeo){
    const nextVersion=(page.version||0)+1;
    const publishedAt=new Date().toISOString();
    const {data,error}=await db.from('cms_pages').update({
      published_data:draftData,published_seo:draftSeo,status:'published',version:nextVersion,
      has_unpublished_changes:false,published_by:session.user.id,updated_by:session.user.id,
      published_at:publishedAt,updated_at:publishedAt
    }).eq('id',page.id).select('*').single();
    if(error)throw error;
    await cmsSaveRevision('page',page.slug,nextVersion,{
      published_data:draftData,published_seo:draftSeo,status:'published',
      page_kind:page.page_kind,source_file:page.source_file,internal_name:page.internal_name
    },'Published '+page.internal_name);
    return data;
  }
  function cmsBlockLabel(block){
    const labels={hero:'Hero',rich_text:'Text section',image_text:'Image + text',cta:'Call to action'};
    return labels[block.type]||block.type||'Section';
  }
  function cmsCustomPreview(block,lang='en'){
    const val=(obj)=>obj?.[lang]||obj?.en||'';
    if(block.type==='hero'){
      return '<section class="pb-preview-block pb-preview-hero"'+(block.image_url?' style="background-image:linear-gradient(90deg,rgba(10,39,61,.82),rgba(10,39,61,.28)),url(\''+esc(block.image_url)+'\')"':'')+'><small>'+esc(val(block.eyebrow))+'</small><h1>'+esc(val(block.title))+'</h1><p>'+esc(val(block.body))+'</p>'+(val(block.button_label)?'<span class="btn primary">'+esc(val(block.button_label))+'</span>':'')+'</section>';
    }
    if(block.type==='image_text'){
      return '<section class="pb-preview-block"><div class="pb-preview-grid">'+(block.image_url?'<img src="'+esc(block.image_url)+'" alt="">':'<div class="pb-image-placeholder">Image</div>')+'<div><small>'+esc(val(block.eyebrow))+'</small><h2>'+esc(val(block.title))+'</h2><p>'+esc(val(block.body))+'</p></div></div></section>';
    }
    if(block.type==='cta'){
      return '<section class="pb-preview-block pb-preview-cta"><h2>'+esc(val(block.title))+'</h2><p>'+esc(val(block.body))+'</p>'+(val(block.button_label)?'<span class="btn primary">'+esc(val(block.button_label))+'</span>':'')+'</section>';
    }
    return '<section class="pb-preview-block"><small>'+esc(val(block.eyebrow))+'</small><h2>'+esc(val(block.title))+'</h2><p>'+esc(val(block.body))+'</p></section>';
  }
  async function cmsPreviewDraft(page,draftData,draftSeo){
    const lang='en';
    if(page.page_kind==='custom'){
      const html=(draftData.sections||[]).map(b=>cmsCustomPreview(b,lang)).join('')||'<div class="empty">This page has no sections yet.</div>';
      openModal('<h2>Draft preview · '+esc(page.internal_name)+'</h2><p class="muted">This is the unpublished draft.</p><div class="pb-preview">'+html+'</div>');
      return;
    }
    openModal('<h2>Draft preview · '+esc(page.internal_name)+'</h2><p class="muted">Section visibility and order below are the unpublished draft.</p><iframe id="pageDraftPreview" class="live-editor-frame" title="Draft preview"></iframe>');
    const frame=document.getElementById('pageDraftPreview');
    frame.src=cmsPageHref(page,lang)+'&cms_draft_preview='+Date.now();
    frame.addEventListener('load',()=>{
      const doc=frame.contentDocument;if(!doc)return;
      const sections=[...(draftData.sections||[])].sort((a,b)=>(a.order||0)-(b.order||0));
      const found=sections.map(s=>({s,el:doc.querySelector(s.selector)})).filter(x=>x.el);
      found.forEach(x=>{x.el.style.display=x.s.visible===false?'none':''});
      const parent=found.find(x=>x.el)?.el?.parentElement;
      if(parent)found.forEach(x=>parent.appendChild(x.el));
      const seo=draftSeo?.[lang]||{};
      if(seo.title)doc.title=seo.title;
    });
  }
  async function renderPages(){
    if(!allowed('super_admin','marketing')){panel.innerHTML='<div class="card">'+notice('Page Builder is available to Super Admin and Marketing users.')+'</div>';return}
    const {data,error}=await db.from('cms_pages').select('*').order('page_kind').order('internal_name');if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><div><h2>Pages & Page Builder</h2><p class="muted">Manage existing layouts or create new pages without editing code.</p></div><button id="newCmsPage" class="btn primary">+ New page</button></div><div class="table-wrap"><table><thead><tr><th>Page</th><th>Type</th><th>State</th><th>Version</th><th></th></tr></thead><tbody>'+
      data.map(p=>'<tr><td><strong>'+esc(p.internal_name)+'</strong><br><small>'+esc(p.page_kind==='custom'?'page.html?slug='+p.slug:p.source_file)+'</small></td><td>'+esc(p.page_kind)+'</td><td>'+(p.status==='published'?'<span class="pill published">published</span>':'<span class="pill draft">'+esc(p.status)+'</span>')+(p.has_unpublished_changes?' <span class="pill draft">draft changes</span>':'')+'</td><td>v'+esc(p.version)+'</td><td><div class="row-actions"><button class="icon-btn" data-edit-page="'+p.id+'">Edit</button><button class="icon-btn" data-preview-page="'+p.id+'">Preview</button>'+(p.status==='published'?'<a class="icon-btn" href="'+esc(cmsPageHref(p))+'" target="_blank">Open ↗</a>':'')+'</div></td></tr>').join('')+
      '</tbody></table></div></div>';
    document.getElementById('newCmsPage').onclick=()=>{
      openModal('<h2>Create a new page</h2><form id="newCmsPageForm" class="stack"><label>Page name<input name="name" required placeholder="e.g. Distributors"></label><label>URL slug<input name="slug" required placeholder="distributors"></label><button class="btn primary">Create draft page</button></form>');
      const form=document.getElementById('newCmsPageForm');
      const name=form.elements.name,slug=form.elements.slug;
      name.oninput=()=>{if(!slug.dataset.touched)slug.value=cmsSlug(name.value)};
      slug.oninput=()=>{slug.dataset.touched='1';slug.value=cmsSlug(slug.value)};
      form.onsubmit=async e=>{
        e.preventDefault();const ff=new FormData(form);const s=cmsSlug(ff.get('slug'));if(!s){alert('Enter a valid slug.');return}
        const emptySeo={en:{title:ff.get('name')+' | Bregan B.V.',description:''},de:{title:ff.get('name')+' | Bregan B.V.',description:''},og_image_url:''};
        const {data:created,error}=await db.from('cms_pages').insert({
          slug:s,internal_name:ff.get('name'),page_kind:'custom',source_file:null,
          draft_data:{sections:[]},published_data:{sections:[]},draft_seo:emptySeo,published_seo:{},
          status:'draft',has_unpublished_changes:true,created_by:session.user.id,updated_by:session.user.id
        }).select('*').single();
        if(error){alert(error.message);return}closeModal();openCmsPageEditor(created);
      };
    };
    panel.querySelectorAll('[data-edit-page]').forEach(b=>b.onclick=()=>openCmsPageEditor(data.find(p=>String(p.id)===b.dataset.editPage)));
    panel.querySelectorAll('[data-preview-page]').forEach(b=>b.onclick=()=>{const p=data.find(x=>String(x.id)===b.dataset.previewPage);cmsPreviewDraft(p,p.draft_data||{},p.draft_seo||{})});
  }
  function openCmsPageEditor(page){
    let workingData=cmsClone(page.draft_data||{sections:[]});
    let workingSeo=cmsClone(page.draft_seo||{});
    if(!Array.isArray(workingData.sections))workingData.sections=[];
    const renderEditor=()=>{
      const isCustom=page.page_kind==='custom';
      panel.innerHTML='<div class="card"><div class="card-head"><div><button id="backPages" class="icon-btn">← Pages</button><h2 class="pb-editor-title">'+esc(page.internal_name)+'</h2><p class="muted">'+(isCustom?'Custom page · page.html?slug='+esc(page.slug):'Existing page · '+esc(page.source_file))+'</p></div><div class="row-actions"><button id="previewCmsPage" class="btn secondary">Preview draft</button><button id="saveCmsPage" class="btn secondary">Save draft</button><button id="publishCmsPage" class="btn primary">Publish</button></div></div>'+
        '<div class="grid-2"><label class="field">Page name<input id="cmsPageName" value="'+esc(page.internal_name)+'"></label><label class="field">Slug<input id="cmsPageSlug" value="'+esc(page.slug)+'" '+(!isCustom||page.status==='published'?'disabled':'')+'></label></div>'+
        '<div class="card form-section"><div class="card-head"><div><h2>SEO</h2><p class="muted">Search title and description shown to Google and social previews.</p></div></div><div class="grid-2"><label class="field">SEO title EN<input id="seoTitleEn" value="'+esc(workingSeo.en?.title||'')+'"></label><label class="field">SEO title DE<input id="seoTitleDe" value="'+esc(workingSeo.de?.title||'')+'"></label></div><div class="grid-2"><label class="field">Description EN<textarea id="seoDescEn" rows="3">'+esc(workingSeo.en?.description||'')+'</textarea></label><label class="field">Description DE<textarea id="seoDescDe" rows="3">'+esc(workingSeo.de?.description||'')+'</textarea></label></div><label class="field">Social share image'+(workingSeo.og_image_url?'<img class="image-preview" src="'+esc(workingSeo.og_image_url)+'" alt="">':'')+'<input id="seoImageFile" type="file" accept="image/*"></label></div>'+
        '<div class="card form-section"><div class="card-head"><div><h2>'+(isCustom?'Page sections':'Existing page layout')+'</h2><p class="muted">'+(isCustom?'Add, edit and reorder page blocks.':'Show, hide or reorder the existing sections without touching code.')+'</p></div>'+(isCustom?'<div class="toolbar"><button class="btn secondary" data-add-block="hero">+ Hero</button><button class="btn secondary" data-add-block="rich_text">+ Text</button><button class="btn secondary" data-add-block="image_text">+ Image + text</button><button class="btn secondary" data-add-block="cta">+ CTA</button></div>':'')+'</div><div id="cmsSections"></div></div>';
      document.getElementById('backPages').onclick=renderPages;
      const list=document.getElementById('cmsSections');
      if(isCustom){
        list.innerHTML=workingData.sections.length?workingData.sections.map((b,i)=>'<div class="pb-section-row"><div><strong>'+esc(cmsBlockLabel(b))+'</strong><small>'+esc(b.title?.en||b.eyebrow?.en||'Untitled section')+'</small></div><div class="row-actions"><button class="icon-btn" data-block-up="'+i+'" '+(i===0?'disabled':'')+'>↑</button><button class="icon-btn" data-block-down="'+i+'" '+(i===workingData.sections.length-1?'disabled':'')+'>↓</button><button class="icon-btn" data-block-edit="'+i+'">Edit</button><button class="icon-btn danger-text" data-block-delete="'+i+'">Delete</button></div></div>').join(''):'<div class="empty">No sections yet. Add a Hero, Text, Image + text or CTA block.</div>';
        panel.querySelectorAll('[data-add-block]').forEach(b=>b.onclick=()=>openCmsBlockEditor(b.dataset.addBlock,null));
        panel.querySelectorAll('[data-block-edit]').forEach(b=>b.onclick=()=>openCmsBlockEditor(workingData.sections[+b.dataset.blockEdit].type,+b.dataset.blockEdit));
        panel.querySelectorAll('[data-block-delete]').forEach(b=>b.onclick=()=>{workingData.sections.splice(+b.dataset.blockDelete,1);renderEditor()});
        panel.querySelectorAll('[data-block-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.blockUp;[workingData.sections[i-1],workingData.sections[i]]=[workingData.sections[i],workingData.sections[i-1]];renderEditor()});
        panel.querySelectorAll('[data-block-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.blockDown;[workingData.sections[i+1],workingData.sections[i]]=[workingData.sections[i],workingData.sections[i+1]];renderEditor()});
      }else{
        list.innerHTML=workingData.sections.map((s,i)=>'<div class="pb-section-row"><div class="pb-section-main"><label><input type="checkbox" data-section-visible="'+i+'" '+(s.visible!==false?'checked':'')+'> Visible</label><input class="pb-label-input" data-section-label="'+i+'" value="'+esc(s.label||'Section '+(i+1))+'"><small>'+esc(s.selector||'')+'</small></div><div class="row-actions"><button class="icon-btn" data-section-up="'+i+'" '+(i===0?'disabled':'')+'>↑</button><button class="icon-btn" data-section-down="'+i+'" '+(i===workingData.sections.length-1?'disabled':'')+'>↓</button></div></div>').join('');
        panel.querySelectorAll('[data-section-visible]').forEach(x=>x.onchange=()=>{workingData.sections[+x.dataset.sectionVisible].visible=x.checked});
        panel.querySelectorAll('[data-section-label]').forEach(x=>x.oninput=()=>{workingData.sections[+x.dataset.sectionLabel].label=x.value});
        panel.querySelectorAll('[data-section-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sectionUp;[workingData.sections[i-1],workingData.sections[i]]=[workingData.sections[i],workingData.sections[i-1]];workingData.sections.forEach((s,j)=>s.order=j+1);renderEditor()});
        panel.querySelectorAll('[data-section-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sectionDown;[workingData.sections[i+1],workingData.sections[i]]=[workingData.sections[i],workingData.sections[i+1]];workingData.sections.forEach((s,j)=>s.order=j+1);renderEditor()});
      }
      const collectSeo=async()=>{
        workingSeo.en={title:document.getElementById('seoTitleEn').value,description:document.getElementById('seoDescEn').value};
        workingSeo.de={title:document.getElementById('seoTitleDe').value,description:document.getElementById('seoDescDe').value};
        const file=document.getElementById('seoImageFile').files[0];
        if(file)workingSeo.og_image_url=await uploadAsset(file,'seo');
      };
      const saveDraft=async()=>{
        try{
          await collectSeo();
          const name=document.getElementById('cmsPageName').value.trim()||page.internal_name;
          const slugInput=document.getElementById('cmsPageSlug');
          const nextSlug=slugInput.disabled?page.slug:cmsSlug(slugInput.value);
          const {data,error}=await db.from('cms_pages').update({
            internal_name:name,slug:nextSlug,draft_data:workingData,draft_seo:workingSeo,
            has_unpublished_changes:true,updated_by:session.user.id,updated_at:new Date().toISOString()
          }).eq('id',page.id).select('*').single();
          if(error)throw error;page=data;return data;
        }catch(err){alert(err.message||err);throw err}
      };
      document.getElementById('previewCmsPage').onclick=async()=>{await collectSeo();cmsPreviewDraft(page,workingData,workingSeo)};
      document.getElementById('saveCmsPage').onclick=async e=>{e.currentTarget.disabled=true;try{await saveDraft();e.currentTarget.textContent='Saved'}finally{e.currentTarget.disabled=false}};
      document.getElementById('publishCmsPage').onclick=async e=>{
        e.currentTarget.disabled=true;e.currentTarget.textContent='Publishing…';
        try{await saveDraft();page=await cmsPublishPage(page,workingData,workingSeo);alert('Published successfully.');renderPages()}catch(err){alert(err.message||err);e.currentTarget.disabled=false;e.currentTarget.textContent='Publish'}
      };
    };
    const openCmsBlockEditor=(type,index)=>{
      const existing=index===null?null:workingData.sections[index];
      const block=cmsClone(existing||{id:'block-'+Date.now(),type,eyebrow:{en:'',de:''},title:{en:'',de:''},body:{en:'',de:''},button_label:{en:'',de:''},button_href:'',image_url:''});
      const needsImage=type==='hero'||type==='image_text';
      const needsButton=type==='hero'||type==='cta';
      openModal('<h2>'+(existing?'Edit ':'Add ')+esc(cmsBlockLabel(block))+'</h2><form id="cmsBlockForm" class="stack">'+
        '<div class="grid-2"><label>Eyebrow EN<input name="eyebrow_en" value="'+esc(block.eyebrow?.en||'')+'"></label><label>Eyebrow DE<input name="eyebrow_de" value="'+esc(block.eyebrow?.de||'')+'"></label></div>'+
        '<div class="grid-2"><label>Title EN<input name="title_en" value="'+esc(block.title?.en||'')+'"></label><label>Title DE<input name="title_de" value="'+esc(block.title?.de||'')+'"></label></div>'+
        '<div class="grid-2"><label>Body EN<textarea name="body_en" rows="5">'+esc(block.body?.en||'')+'</textarea></label><label>Body DE<textarea name="body_de" rows="5">'+esc(block.body?.de||'')+'</textarea></label></div>'+
        (needsImage?'<label class="upload-field">Image'+(block.image_url?'<img class="image-preview" src="'+esc(block.image_url)+'" alt="">':'')+'<input name="image_file" type="file" accept="image/*"></label>':'')+
        (needsButton?'<div class="grid-3"><label>Button EN<input name="button_en" value="'+esc(block.button_label?.en||'')+'"></label><label>Button DE<input name="button_de" value="'+esc(block.button_label?.de||'')+'"></label><label>Button destination<input name="button_href" value="'+esc(block.button_href||'')+'" placeholder="products.html"></label></div>':'')+
        '<button class="btn primary">Save section</button></form>');
      document.getElementById('cmsBlockForm').onsubmit=async e=>{
        e.preventDefault();const ff=new FormData(e.currentTarget);
        block.eyebrow={en:ff.get('eyebrow_en'),de:ff.get('eyebrow_de')};block.title={en:ff.get('title_en'),de:ff.get('title_de')};block.body={en:ff.get('body_en'),de:ff.get('body_de')};
        if(needsButton){block.button_label={en:ff.get('button_en'),de:ff.get('button_de')};block.button_href=ff.get('button_href')}
        const file=ff.get('image_file');if(needsImage&&file&&file.size){try{block.image_url=await uploadAsset(file,'page-block')}catch(err){alert(err.message||err);return}}
        if(index===null)workingData.sections.push(block);else workingData.sections[index]=block;
        closeModal();renderEditor();
      };
    };
    renderEditor();
  }


  async function cmsPublishGlobal(key,draftData,note){
    const {data:current,error:readError}=await db.from('cms_globals').select('*').eq('key',key).single();
    if(readError)throw readError;
    const nextVersion=(current.version||0)+1;
    const now=new Date().toISOString();
    const {data,error}=await db.from('cms_globals').update({
      published_data:draftData,version:nextVersion,published_by:session.user.id,updated_by:session.user.id,published_at:now,updated_at:now
    }).eq('key',key).select('*').single();
    if(error)throw error;
    await cmsSaveRevision('global',key,nextVersion,{published_data:draftData},note||('Published '+key));
    return data;
  }
  async function renderNavigation(){
    if(!allowed('super_admin','marketing')){panel.innerHTML='<div class="card">'+notice('Navigation & Footer is available to Super Admin and Marketing users.')+'</div>';return}
    const [{data:globals,error},{data:pages,error:pageError}]=await Promise.all([
      db.from('cms_globals').select('*').in('key',['navigation','footer']),
      db.from('cms_pages').select('id,slug,internal_name,page_kind,source_file,status').order('internal_name')
    ]);
    if(error)throw error;if(pageError)throw pageError;
    const navRow=globals.find(x=>x.key==='navigation');
    const footerRow=globals.find(x=>x.key==='footer');
    let nav=cmsClone(navRow?.draft_data||{items:[]});
    let footer=cmsClone(footerRow?.draft_data||{});
    if(!Array.isArray(nav.items))nav.items=[];
    const pageOptions=(pages||[]).filter(p=>p.status==='published');
    const targetFor=p=>p.page_kind==='custom'?'page.html?slug='+p.slug:p.source_file;
    const draw=()=>{
      panel.innerHTML='<div class="card"><div class="card-head"><div><h2>Header navigation</h2><p class="muted">Change menu labels, destinations, visibility and order.</p></div><div class="row-actions"><button id="addNavItem" class="btn secondary">+ Menu item</button><button id="saveNavDraft" class="btn secondary">Save draft</button><button id="publishNav" class="btn primary">Publish menu</button></div></div><div id="navItemList">'+
        (nav.items.length?nav.items.map((item,i)=>'<div class="pb-section-row"><div><strong>'+esc(item.label?.en||'Menu item')+'</strong><small>'+esc(item.label?.de||'')+' · '+esc(item.href||'')+(item.visible===false?' · hidden':'')+'</small></div><div class="row-actions"><button class="icon-btn" data-nav-up="'+i+'" '+(i===0?'disabled':'')+'>↑</button><button class="icon-btn" data-nav-down="'+i+'" '+(i===nav.items.length-1?'disabled':'')+'>↓</button><button class="icon-btn" data-nav-edit="'+i+'">Edit</button><button class="icon-btn danger-text" data-nav-delete="'+i+'">Delete</button></div></div>').join(''):'<div class="empty">No menu items.</div>')+
        '</div></div>'+
        '<div class="card"><div class="card-head"><div><h2>Footer</h2><p class="muted">Manage footer text and final call to action.</p></div><div class="row-actions"><button id="saveFooterDraft" class="btn secondary">Save draft</button><button id="publishFooter" class="btn primary">Publish footer</button></div></div>'+
        '<div class="grid-2"><label class="field">Blurb EN<textarea id="footerBlurbEn" rows="3">'+esc(footer.blurb?.en||'')+'</textarea></label><label class="field">Blurb DE<textarea id="footerBlurbDe" rows="3">'+esc(footer.blurb?.de||'')+'</textarea></label></div>'+
        '<div class="grid-2"><label class="field">Brand chip EN<input id="footerChipEn" value="'+esc(footer.chip?.en||'')+'"></label><label class="field">Brand chip DE<input id="footerChipDe" value="'+esc(footer.chip?.de||'')+'"></label></div>'+
        '<div class="grid-2"><label class="field">CTA EN<input id="footerCtaEn" value="'+esc(footer.cta?.en||'')+'"></label><label class="field">CTA DE<input id="footerCtaDe" value="'+esc(footer.cta?.de||'')+'"></label></div>'+
        '<label><input id="footerPrivacy" type="checkbox" '+(footer.show_privacy!==false?'checked':'')+'> Show Privacy link</label></div>';
      const openItem=(index)=>{
        const item=index===null?{label:{en:'',de:''},href:'',visible:true}:cmsClone(nav.items[index]);
        const matched=pageOptions.find(p=>targetFor(p)===item.href);
        openModal('<h2>'+(index===null?'Add menu item':'Edit menu item')+'</h2><form id="navItemForm" class="stack"><div class="grid-2"><label>Label EN<input name="label_en" required value="'+esc(item.label?.en||'')+'"></label><label>Label DE<input name="label_de" value="'+esc(item.label?.de||'')+'"></label></div>'+
          '<label>Destination<select name="page_target"><option value="">Custom link</option>'+pageOptions.map(p=>'<option value="'+esc(targetFor(p))+'" '+(matched&&matched.id===p.id?'selected':'')+'>'+esc(p.internal_name)+'</option>').join('')+'</select></label>'+
          '<label>Custom link<input name="href" value="'+esc(matched?'':item.href||'')+'" placeholder="https://... or contact.html"></label>'+
          '<label><input type="checkbox" name="visible" '+(item.visible!==false?'checked':'')+'> Visible in menu</label><button class="btn primary">Save menu item</button></form>');
        document.getElementById('navItemForm').onsubmit=e=>{
          e.preventDefault();const ff=new FormData(e.currentTarget);item.label={en:ff.get('label_en'),de:ff.get('label_de')};item.href=ff.get('page_target')||ff.get('href');item.visible=ff.get('visible')==='on';
          if(!item.href){alert('Choose a destination or enter a link.');return}
          if(index===null)nav.items.push(item);else nav.items[index]=item;closeModal();draw();
        };
      };
      document.getElementById('addNavItem').onclick=()=>openItem(null);
      panel.querySelectorAll('[data-nav-edit]').forEach(b=>b.onclick=()=>openItem(+b.dataset.navEdit));
      panel.querySelectorAll('[data-nav-delete]').forEach(b=>b.onclick=()=>{nav.items.splice(+b.dataset.navDelete,1);draw()});
      panel.querySelectorAll('[data-nav-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.navUp;[nav.items[i-1],nav.items[i]]=[nav.items[i],nav.items[i-1]];draw()});
      panel.querySelectorAll('[data-nav-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.navDown;[nav.items[i+1],nav.items[i]]=[nav.items[i],nav.items[i+1]];draw()});
      const saveNav=async()=>{const {data,error}=await db.from('cms_globals').update({draft_data:nav,updated_by:session.user.id,updated_at:new Date().toISOString()}).eq('key','navigation').select('*').single();if(error)throw error;return data};
      document.getElementById('saveNavDraft').onclick=async e=>{e.currentTarget.disabled=true;try{await saveNav();e.currentTarget.textContent='Saved'}catch(err){alert(err.message||err)}finally{e.currentTarget.disabled=false}};
      document.getElementById('publishNav').onclick=async e=>{e.currentTarget.disabled=true;try{await saveNav();await cmsPublishGlobal('navigation',nav,'Published navigation');alert('Navigation published.');draw()}catch(err){alert(err.message||err)}finally{e.currentTarget.disabled=false}};
      const collectFooter=()=>{footer={blurb:{en:document.getElementById('footerBlurbEn').value,de:document.getElementById('footerBlurbDe').value},chip:{en:document.getElementById('footerChipEn').value,de:document.getElementById('footerChipDe').value},cta:{en:document.getElementById('footerCtaEn').value,de:document.getElementById('footerCtaDe').value},show_privacy:document.getElementById('footerPrivacy').checked};return footer};
      const saveFooter=async()=>{collectFooter();const {data,error}=await db.from('cms_globals').update({draft_data:footer,updated_by:session.user.id,updated_at:new Date().toISOString()}).eq('key','footer').select('*').single();if(error)throw error;return data};
      document.getElementById('saveFooterDraft').onclick=async e=>{e.currentTarget.disabled=true;try{await saveFooter();e.currentTarget.textContent='Saved'}catch(err){alert(err.message||err)}finally{e.currentTarget.disabled=false}};
      document.getElementById('publishFooter').onclick=async e=>{e.currentTarget.disabled=true;try{await saveFooter();await cmsPublishGlobal('footer',footer,'Published footer');alert('Footer published.');draw()}catch(err){alert(err.message||err)}finally{e.currentTarget.disabled=false}};
    };
    draw();
  }
  async function renderHistory(){
    if(!allowed('super_admin','marketing')){panel.innerHTML='<div class="card">'+notice('Version History is available to Super Admin and Marketing users.')+'</div>';return}
    const {data,error}=await db.from('cms_revisions').select('*').order('created_at',{ascending:false}).limit(100);if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><div><h2>Version history</h2><p class="muted">Restore creates a new draft. It never changes the live website until you publish it.</p></div></div>'+(data.length?'<div class="table-wrap"><table><thead><tr><th>Item</th><th>Version</th><th>Published</th><th>Note</th><th></th></tr></thead><tbody>'+
      data.map(r=>'<tr><td><strong>'+esc(r.entity_key)+'</strong><br><small>'+esc(r.entity_type)+'</small></td><td>v'+esc(r.version)+'</td><td>'+fmt(r.created_at)+'</td><td>'+esc(r.note||'')+'</td><td><button class="icon-btn" data-restore-revision="'+r.id+'">Restore to draft</button></td></tr>').join('')+
      '</tbody></table></div>':'<div class="empty">No published revisions yet. New versions will appear here after publishing.</div>')+'</div>';
    panel.querySelectorAll('[data-restore-revision]').forEach(b=>b.onclick=async()=>{
      const rev=data.find(x=>String(x.id)===b.dataset.restoreRevision);if(!rev)return;
      if(!confirm('Restore version '+rev.version+' of '+rev.entity_key+' to a new draft?'))return;
      try{
        if(rev.entity_type==='page'){
          const snap=rev.snapshot||{};
          const {error}=await db.from('cms_pages').update({
            draft_data:snap.published_data||{sections:[]},draft_seo:snap.published_seo||{},has_unpublished_changes:true,
            updated_by:session.user.id,updated_at:new Date().toISOString()
          }).eq('slug',rev.entity_key);
          if(error)throw error;
        }else{
          const {error}=await db.from('cms_globals').update({
            draft_data:rev.snapshot?.published_data||{},updated_by:session.user.id,updated_at:new Date().toISOString()
          }).eq('key',rev.entity_key);
          if(error)throw error;
        }
        alert('Restored to draft. Review it and publish when ready.');
      }catch(err){alert(err.message||err)}
    });
  }

  async function renderSiteEditor(){
    if(!allowed('super_admin','marketing')){
      panel.innerHTML='<div class="card">'+notice('Live Site Editor is available to Super Admin and Marketing users.')+'</div>';
      return;
    }
    const pages=[
      ['index.html','Homepage'],['products.html','Products'],['solutions.html','Solutions'],['about.html','About Bregan'],
      ['insights.html','Insights'],['contact.html','Contact'],['poultry.html','Poultry'],['ruminants.html','Ruminants'],['aquaculture.html','Aquaculture']
    ];
    panel.innerHTML=
      '<div class="card"><div class="card-head"><div><h2>Click directly on the website</h2><p class="muted">Orange outlines are editable text. Blue buttons change images. Green buttons open product details.</p></div></div>'+
      '<div class="editor-toolbar"><label>Page<select id="editorPage">'+pages.map(p=>'<option value="'+p[0]+'">'+p[1]+'</option>').join('')+'</select></label>'+
      '<label>Language<select id="editorLang"><option value="en">English</option><option value="de">Deutsch</option></select></label>'+
      '<button class="btn secondary" id="reloadPreview">Reload preview</button><span id="editorStatus" class="inline-status"></span></div>'+
      '<div class="live-editor-shell"><iframe id="liveEditorFrame" class="live-editor-frame" title="Bregan live website editor"></iframe></div>'+
      '<div class="editor-guide"><span class="text">Click text → edit</span><span class="image">Edit image → upload file</span><span class="product">Edit product → full product editor</span></div></div>';

    const frame=document.getElementById('liveEditorFrame');
    const pageSelect=document.getElementById('editorPage');
    const langSelect=document.getElementById('editorLang');
    const status=document.getElementById('editorStatus');

    function loadPreview(){
      status.textContent='Loading…';
      frame.src='../'+pageSelect.value+'?lang='+langSelect.value+'&cms_preview=1&v='+Date.now();
    }

    function cssPath(el,doc){
      if(el.id) return '#'+CSS.escape(el.id);
      const parts=[];
      let cur=el;
      while(cur&&cur!==doc.body){
        let part=cur.tagName.toLowerCase();
        const parent=cur.parentElement;
        if(parent){
          const same=[...parent.children].filter(x=>x.tagName===cur.tagName);
          if(same.length>1) part+=':nth-of-type('+(same.indexOf(cur)+1)+')';
        }
        parts.unshift(part);
        cur=parent;
      }
      return parts.join(' > ');
    }

    async function editI18n(key,el){
      const {data,error}=await db.from('content_entries').select('*').eq('key',key).maybeSingle();
      if(error){alert(error.message);return}
      const value=data?.value||{en:el.textContent.trim(),de:''};
      openModal('<h2>Edit website text</h2><p class="muted">This text is reused anywhere the same content field appears.</p>'+
        '<form id="liveI18nForm" class="stack"><label>English<textarea name="en" rows="5">'+esc(value.en||'')+'</textarea></label>'+
        '<label>Deutsch<textarea name="de" rows="5">'+esc(value.de||'')+'</textarea></label>'+
        '<button class="btn primary">Save & update preview</button></form>');
      document.getElementById('liveI18nForm').onsubmit=async e=>{
        e.preventDefault();const ff=new FormData(e.currentTarget);
        const payload={key,section:data?.section||'live_editor',label:data?.label||key,value:{en:ff.get('en'),de:ff.get('de')},status:'published',updated_by:session.user.id,updated_at:new Date().toISOString()};
        const {error}=await db.from('content_entries').upsert(payload);
        if(error){alert(error.message);return}
        closeModal();loadPreview();
      };
    }

    async function editDirectText(el){
      const page=pageSelect.value,lang=langSelect.value,selector=cssPath(el,frame.contentDocument);
      const {data,error}=await db.from('page_overrides').select('*').eq('page',page).eq('selector',selector).eq('lang',lang).eq('kind','text').maybeSingle();
      if(error){alert(error.message);return}
      const current=data?.value??el.textContent.trim();
      openModal('<h2>Edit this text</h2><p class="muted">'+esc(pages.find(p=>p[0]===page)?.[1]||page)+' · '+(lang==='de'?'Deutsch':'English')+'</p>'+
        '<form id="directTextForm" class="stack"><label>Text<textarea name="value" rows="6">'+esc(current)+'</textarea></label>'+
        '<button class="btn primary">Save & update preview</button></form>');
      document.getElementById('directTextForm').onsubmit=async e=>{
        e.preventDefault();const value=new FormData(e.currentTarget).get('value');
        const payload={page,selector,lang,kind:'text',value,status:'published',updated_by:session.user.id,updated_at:new Date().toISOString()};
        const {error}=await db.from('page_overrides').upsert(payload,{onConflict:'page,selector,lang,kind'});
        if(error){alert(error.message);return}
        closeModal();loadPreview();
      };
    }

    async function editVisual(key,label){
      const {data,error}=await db.from('site_settings').select('value').eq('key','visuals').maybeSingle();
      if(error){alert(error.message);return}
      const visuals=data?.value||{};
      const current=visuals[key]||'';
      openModal('<h2>'+esc(label)+'</h2><p class="muted">Choose an image file. No URL or code is required.</p>'+
        '<form id="visualUploadForm" class="stack">'+(current?'<img class="image-preview" src="'+esc(current)+'" alt="">':'')+
        '<label class="upload-field">Choose image<input type="file" name="file" accept="image/*" required></label>'+
        '<button class="btn primary">Upload & publish</button></form>');
      document.getElementById('visualUploadForm').onsubmit=async e=>{
        e.preventDefault();const file=new FormData(e.currentTarget).get('file');
        try{
          const url=await uploadAsset(file,'visual-'+key);
          const next={...visuals,[key]:url};
          const {error}=await db.from('site_settings').upsert({key:'visuals',value:next,updated_by:session.user.id,updated_at:new Date().toISOString()});
          if(error)throw error;
          closeModal();loadPreview();
        }catch(err){alert(err.message||err)}
      };
    }

    async function editInlineImage(img){
      const page=pageSelect.value;
      const selector=cssPath(img,frame.contentDocument);
      openModal('<h2>Replace image</h2><p class="muted">Choose an image file. No URL is required.</p>'+
        '<form id="inlineImageForm" class="stack"><img class="image-preview" src="'+esc(img.src)+'" alt="">'+
        '<label class="upload-field">Choose image<input type="file" name="file" accept="image/*" required></label>'+
        '<button class="btn primary">Upload & publish</button></form>');
      document.getElementById('inlineImageForm').onsubmit=async e=>{
        e.preventDefault();const file=new FormData(e.currentTarget).get('file');
        try{
          const url=await uploadAsset(file,'page-image');
          const payload={page,selector,lang:'all',kind:'image_src',value:url,status:'published',updated_by:session.user.id,updated_at:new Date().toISOString()};
          const {error}=await db.from('page_overrides').upsert(payload,{onConflict:'page,selector,lang,kind'});
          if(error)throw error;
          closeModal();loadPreview();
        }catch(err){alert(err.message||err)}
      };
    }

    async function editProductById(id){
      const {data,error}=await db.from('products').select('*').eq('id',id).maybeSingle();
      if(error||!data){alert(error?.message||'Product not found');return}
      bindProductModal(data);
    }

    function wirePreview(){
      const doc=frame.contentDocument;
      if(!doc){status.textContent='Preview unavailable';return}
      let style=doc.getElementById('breganCmsLiveStyle');
      if(!style){style=doc.createElement('style');
      style.id='breganCmsLiveStyle';
      style.textContent=
        '[data-cms-live-text]{outline:1px dashed transparent!important;outline-offset:3px;cursor:pointer!important}'+
        '[data-cms-live-text]:hover{outline-color:#f47c20!important;background:rgba(244,124,32,.08)!important}'+
        '.cms-live-action{position:absolute!important;z-index:99999!important;top:10px!important;right:10px!important;border:0!important;border-radius:999px!important;padding:8px 11px!important;font:700 11px/1 Arial,sans-serif!important;box-shadow:0 6px 20px rgba(0,0,0,.2)!important;cursor:pointer!important}'+
        '.cms-live-image-action,.cms-live-inline-image-action{background:#1d6f9e!important;color:#fff!important}'+
        '.cms-live-product-action{background:#26744a!important;color:#fff!important}';
      doc.head.appendChild(style);}

      const imageTargets=[
        ['.hero','hero','Homepage hero image'],
        ['.page-hero','page_hero','Page hero image'],
        ['.species-card.poultry','poultry','Poultry image'],
        ['.species-card.ruminant','ruminant','Ruminant image'],
        ['.species-card.aqua','aqua','Aquaculture image'],
        ['.species-card.feedmills','feedmills','Feed mill image'],
        ['.journey-photo','journey','Journey image'],
        ['.story-art','story_factory','Company / factory image'],
        ['.explore-tile:nth-child(1)','explore_1','Explore image 1'],
        ['.explore-tile:nth-child(2)','explore_2','Explore image 2'],
        ['.explore-tile:nth-child(3)','explore_3','Explore image 3'],
        ['.species-hero.poultry','poultry','Poultry hero image'],
        ['.species-hero.ruminant','ruminant','Ruminant hero image'],
        ['.species-hero.aqua','aqua','Aquaculture hero image']
      ];
      imageTargets.forEach(([selector,key,label])=>{
        doc.querySelectorAll(selector).forEach(el=>{
          if(el.querySelector(':scope > .cms-live-image-action'))return;
          if(frame.contentWindow.getComputedStyle(el).position==='static')el.style.position='relative';
          const b=doc.createElement('button');b.type='button';b.className='cms-live-action cms-live-image-action';b.textContent='Edit image';
          b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editVisual(key,label)});
          el.appendChild(b);
        });
      });

      doc.querySelectorAll('.product-card,.related-product-card,.species-product').forEach(card=>{
        const a=card.matches('a[href*="product.html?id="]')?card:(card.querySelector('a[href*="product.html?id="]')||card.closest('a[href*="product.html?id="]'));
        if(!a)return;
        const id=new URL(a.href,frame.src).searchParams.get('id');if(!id)return;
        if(frame.contentWindow.getComputedStyle(card).position==='static')card.style.position='relative';
        if(card.querySelector(':scope > .cms-live-product-action'))return;
        const b=doc.createElement('button');b.type='button';b.className='cms-live-action cms-live-product-action';b.textContent='Edit product';
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editProductById(id)});
        card.appendChild(b);
      });

      doc.querySelectorAll('.brand-logo-image').forEach(img=>{
        const parent=img.parentElement;if(!parent||parent.querySelector(':scope > .cms-live-logo-action'))return;
        if(frame.contentWindow.getComputedStyle(parent).position==='static')parent.style.position='relative';
        const b=doc.createElement('button');b.type='button';b.className='cms-live-action cms-live-image-action cms-live-logo-action';b.textContent='Edit logo';
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editVisual('logo','Bregan logo')});
        parent.appendChild(b);
      });

      doc.querySelectorAll('img:not(.brand-logo-image)').forEach(img=>{
        if(img.closest('.product-card,.related-product-card,.species-product'))return;
        const parent=img.parentElement;if(!parent||parent.querySelector(':scope > .cms-live-inline-image-action'))return;
        if(frame.contentWindow.getComputedStyle(parent).position==='static')parent.style.position='relative';
        const b=doc.createElement('button');b.type='button';b.className='cms-live-action cms-live-inline-image-action';b.textContent='Edit image';
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editInlineImage(img)});
        parent.appendChild(b);
      });

      doc.querySelectorAll('[data-i18n]').forEach(el=>{
        if(el.closest('.product-card,.related-product-card'))return;
        el.dataset.cmsLiveText='1';
        el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editI18n(el.dataset.i18n,el)});
      });

      doc.querySelectorAll('h1,h2,h3,h4,p,span,a,button,small,strong,li,label').forEach(el=>{
        if(el.dataset.i18n||el.dataset.cmsLiveText)return;
        if(el.closest('.product-card,.related-product-card,.cms-live-action,.modal,.mail-fallback'))return;
        if(el.children.length>0)return;
        const t=el.textContent.trim();
        if(!t||t.length>1200)return;
        el.dataset.cmsLiveText='1';
        el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();editDirectText(el)});
      });
      status.textContent='Ready — click any highlighted item';
    }

    frame.addEventListener('load',()=>{status.textContent='Preparing editor…';setTimeout(wirePreview,900);setTimeout(wirePreview,2200)});
    pageSelect.onchange=loadPreview;
    langSelect.onchange=loadPreview;
    document.getElementById('reloadPreview').onclick=loadPreview;
    loadPreview();
  }

  async function renderDashboard(){
    const [p,c,e,i,d]=await Promise.all([
      db.from('products').select('id,status',{count:'exact',head:true}),
      db.from('content_entries').select('key',{count:'exact',head:true}),
      db.from('events').select('id,status',{count:'exact',head:true}),
      db.from('inquiries').select('id,status',{count:'exact',head:true}).eq('status','new'),
      db.from('documents').select('id',{count:'exact',head:true})
    ]);
    panel.innerHTML='<div class="stats">'+
      [['Products',p.count],['Website fields',c.count],['Events',e.count],['New inquiries',i.count]].map(x=>'<div class="stat"><span>'+x[0]+'</span><strong>'+(x[1]??0)+'</strong></div>').join('')+
      '</div><div class="card"><div class="card-head"><h2>CMS status</h2></div>'+
      notice('The public Bregan website can read published CMS content while draft items stay private. Use Save/Publish in each module to control visibility.')+
      '<p class="muted">Documents: '+(d.count??0)+' · Logged in as '+esc(profile.role.replaceAll('_',' '))+'</p></div>';
  }

  function productForm(p={}){
    const bEn=(p.benefits?.en||[]).join('\n'), bDe=(p.benefits?.de||[]).join('\n');
    return '<form id="productForm" class="stack">'+
    '<input type="hidden" name="old_id" value="'+esc(p.id||'')+'">'+
    '<div class="grid-2"><label>Name<input name="name" required value="'+esc(p.name||'')+'"></label><label>Slug / ID<input name="id" required value="'+esc(p.id||'')+'"></label></div>'+
    '<div class="grid-3"><label>Type<input name="type" value="'+esc(p.type||'')+'"></label><label>Category<input name="category" value="'+esc(p.category||'')+'"></label><label>Status<select name="status"><option '+(p.status==='published'?'selected':'')+'>published</option><option '+(p.status==='draft'?'selected':'')+'>draft</option><option '+(p.status==='archived'?'selected':'')+'>archived</option></select></label></div>'+
    '<div class="grid-2"><label>Species (comma separated)<input name="species" value="'+esc((p.species||[]).join(', '))+'"></label><label>Solutions (comma separated)<input name="solutions" value="'+esc((p.solutions||[]).join(', '))+'"></label></div>'+
    '<div class="grid-3"><label>Consistency<input name="consistency" value="'+esc(p.consistency||'')+'"></label><label>Packaging<input name="packaging" value="'+esc(p.packaging||'')+'"></label><label>Inclusion<input name="inclusion" value="'+esc(p.inclusion||'')+'"></label></div>'+
    '<input type="hidden" name="current_image_url" value="'+esc(p.image_url||'')+'">'+
    '<label class="upload-field">Product image'+(p.image_url?'<img class="image-preview" src="'+esc(p.image_url)+'" alt="">':'')+'<input type="file" name="image_file" accept="image/*"></label>'+
    '<div class="form-section"><h3>English</h3><label>Summary<textarea name="summary_en" rows="2">'+esc(txt(p.summary,'en'))+'</textarea></label><label>Description<textarea name="description_en" rows="4">'+esc(txt(p.description,'en'))+'</textarea></label><label>Benefits — one per line<textarea name="benefits_en" rows="5">'+esc(bEn)+'</textarea></label><label>Composition<textarea name="composition_en" rows="2">'+esc(txt(p.composition,'en'))+'</textarea></label></div>'+
    '<div class="form-section"><h3>Deutsch</h3><label>Summary<textarea name="summary_de" rows="2">'+esc(txt(p.summary,'de'))+'</textarea></label><label>Description<textarea name="description_de" rows="4">'+esc(txt(p.description,'de'))+'</textarea></label><label>Benefits — one per line<textarea name="benefits_de" rows="5">'+esc(bDe)+'</textarea></label><label>Composition<textarea name="composition_de" rows="2">'+esc(txt(p.composition,'de'))+'</textarea></label></div>'+
    '<label><input type="checkbox" name="featured" '+(p.featured?'checked':'')+'> Featured product</label>'+
    '<button class="btn primary" type="submit">Save product</button></form>';
  }

  async function renderProducts(){
    const {data,error}=await db.from('products').select('*').order('sort_order').order('name'); if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><h2>Product catalogue</h2><button id="newProduct" class="btn primary">+ Add product</button></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Type</th><th>Species</th><th>Status</th><th></th></tr></thead><tbody>'+
      data.map(p=>'<tr><td><strong>'+esc(p.name)+'</strong><br><small>'+esc(p.id)+'</small></td><td>'+esc(p.type)+'</td><td>'+esc((p.species||[]).join(' · '))+'</td><td><span class="pill '+esc(p.status)+'">'+esc(p.status)+'</span></td><td><div class="row-actions"><button class="icon-btn" data-edit-product="'+esc(p.id)+'">Edit</button><button class="icon-btn" data-delete-product="'+esc(p.id)+'">Delete</button></div></td></tr>').join('')+
      '</tbody></table></div></div>';
    document.getElementById('newProduct').onclick=()=>bindProductModal({});
    panel.querySelectorAll('[data-edit-product]').forEach(b=>b.onclick=()=>bindProductModal(data.find(p=>p.id===b.dataset.editProduct)));
    panel.querySelectorAll('[data-delete-product]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this product?'))return;const {error}=await db.from('products').delete().eq('id',b.dataset.deleteProduct);if(error)alert(error.message);else renderProducts()});
  }

  function bindProductModal(p){
    openModal('<h2>'+(p.id?'Edit product':'New product')+'</h2>'+productForm(p));
    document.getElementById('productForm').onsubmit=async e=>{
      e.preventDefault(); const f=new FormData(e.currentTarget);
      let imageUrl=f.get('current_image_url')||null;
      const imageFile=f.get('image_file');
      if(imageFile&&imageFile.size){try{imageUrl=await uploadAsset(imageFile,'product')}catch(err){alert(err.message||err);return}}
      const payload={
        id:f.get('id').trim(),name:f.get('name').trim(),type:f.get('type'),category:f.get('category'),
        species:arr(f.get('species')),solutions:arr(f.get('solutions')),consistency:f.get('consistency'),packaging:f.get('packaging'),
        inclusion:f.get('inclusion'),image_url:imageUrl,status:f.get('status'),featured:f.get('featured')==='on',
        summary:{en:f.get('summary_en'),de:f.get('summary_de')},description:{en:f.get('description_en'),de:f.get('description_de')},
        benefits:{en:lines(f.get('benefits_en')),de:lines(f.get('benefits_de'))},composition:{en:f.get('composition_en'),de:f.get('composition_de')},
        updated_by:session.user.id,updated_at:new Date().toISOString(),published_at:f.get('status')==='published'?new Date().toISOString():null
      };
      const old=f.get('old_id');
      let res;
      if(old&&old!==payload.id){res=await db.from('products').insert({...payload,created_by:session.user.id});if(!res.error)await db.from('products').delete().eq('id',old)}
      else res=await db.from('products').upsert({...payload,...(!old?{created_by:session.user.id}: {})});
      if(res.error){alert(res.error.message);return} closeModal(); currentView==='siteEditor'?renderSiteEditor():renderProducts();
    };
  }

  async function renderContent(){
    if(!allowed('super_admin','marketing')){panel.innerHTML='<div class="card">'+notice('Text editing is available to Super Admin and Marketing users.')+'</div>';return}
    const [{data,error},{data:overrides,error:overrideError}]=await Promise.all([
      db.from('content_entries').select('*').order('key'),
      db.from('page_overrides').select('*').order('page').order('updated_at',{ascending:false})
    ]);
    if(error)throw error;if(overrideError)throw overrideError;
    panel.innerHTML=
      '<div class="card"><div class="card-head"><div><h2>Shared website text</h2><p class="muted">These fields are used in one or more places. The Live Site Editor is the easiest way to find them visually.</p></div></div><div class="table-wrap"><table><thead><tr><th>Field</th><th>English</th><th>Deutsch</th><th></th></tr></thead><tbody>'+
      (data||[]).map(x=>'<tr><td><strong>'+esc(x.label||x.key)+'</strong></td><td>'+esc(txt(x.value,'en')).slice(0,120)+'</td><td>'+esc(txt(x.value,'de')).slice(0,120)+'</td><td><button class="icon-btn" data-edit-content="'+esc(x.key)+'">Edit</button></td></tr>').join('')+
      '</tbody></table></div></div>'+
      '<div class="card"><div class="card-head"><div><h2>Page-specific text changes</h2><p class="muted">These are texts you clicked directly in Live Site Editor.</p></div></div>'+
      ((overrides||[]).length?'<div class="table-wrap"><table><thead><tr><th>Page</th><th>Language</th><th>Text</th><th></th></tr></thead><tbody>'+
        overrides.map(x=>'<tr><td><strong>'+esc(x.page.replace('.html',''))+'</strong></td><td>'+esc(x.lang.toUpperCase())+'</td><td>'+esc(x.value).slice(0,180)+'</td><td><div class="row-actions"><button class="icon-btn" data-edit-override="'+x.id+'">Edit</button><button class="icon-btn" data-delete-override="'+x.id+'">Delete</button></div></td></tr>').join('')+
        '</tbody></table></div>':'<div class="empty">No page-specific text changes yet.</div>')+'</div>';

    panel.querySelectorAll('[data-edit-content]').forEach(b=>b.onclick=()=>{
      const x=data.find(y=>y.key===b.dataset.editContent);
      openModal('<h2>Edit website text</h2><form id="contentForm" class="stack"><label>English<textarea name="en" rows="5">'+esc(txt(x.value,'en'))+'</textarea></label><label>Deutsch<textarea name="de" rows="5">'+esc(txt(x.value,'de'))+'</textarea></label><button class="btn primary">Save & publish</button></form>');
      document.getElementById('contentForm').onsubmit=async e=>{e.preventDefault();const ff=new FormData(e.currentTarget);const {error}=await db.from('content_entries').update({value:{en:ff.get('en'),de:ff.get('de')},status:'published',updated_by:session.user.id,updated_at:new Date().toISOString()}).eq('key',x.key);if(error)alert(error.message);else{closeModal();renderContent()}};
    });
    panel.querySelectorAll('[data-edit-override]').forEach(b=>b.onclick=()=>{
      const x=overrides.find(y=>String(y.id)===b.dataset.editOverride);
      openModal('<h2>Edit page text</h2><p class="muted">'+esc(x.page)+' · '+esc(x.lang.toUpperCase())+'</p><form id="overrideForm" class="stack"><label>Text<textarea name="value" rows="6">'+esc(x.value)+'</textarea></label><button class="btn primary">Save & publish</button></form>');
      document.getElementById('overrideForm').onsubmit=async e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('value');const {error}=await db.from('page_overrides').update({value,status:'published',updated_by:session.user.id,updated_at:new Date().toISOString()}).eq('id',x.id);if(error)alert(error.message);else{closeModal();renderContent()}};
    });
    panel.querySelectorAll('[data-delete-override]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this page-specific text change? The original website text will return.'))return;const {error}=await db.from('page_overrides').delete().eq('id',b.dataset.deleteOverride);if(error)alert(error.message);else renderContent()});
  }
  async function renderEvents(){
    const {data,error}=await db.from('events').select('*').order('starts_on',{ascending:false}); if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><h2>Fairs & events</h2><button id="newEvent" class="btn primary">+ Add event</button></div>'+(data.length?'<div class="table-wrap"><table><thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>'+data.map(x=>'<tr><td><strong>'+esc(txt(x.title,'en'))+'</strong></td><td>'+esc(x.starts_on||'—')+'</td><td>'+esc([x.venue,x.location,x.country].filter(Boolean).join(' · '))+'</td><td><span class="pill '+esc(x.status)+'">'+esc(x.status)+'</span></td><td><button class="icon-btn" data-edit-event="'+x.id+'">Edit</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No events yet.</div>')+'</div>';
    const edit=x=>{
      openModal('<h2>'+(x.id?'Edit event':'New event')+'</h2><form id="eventForm" class="stack"><div class="grid-2"><label>Title EN<input name="title_en" required value="'+esc(txt(x.title,'en'))+'"></label><label>Title DE<input name="title_de" value="'+esc(txt(x.title,'de'))+'"></label></div><div class="grid-2"><label>Start<input type="date" name="starts_on" value="'+esc(x.starts_on||'')+'"></label><label>End<input type="date" name="ends_on" value="'+esc(x.ends_on||'')+'"></label></div><div class="grid-3"><label>Venue<input name="venue" value="'+esc(x.venue||'')+'"></label><label>City<input name="location" value="'+esc(x.location||'')+'"></label><label>Country<input name="country" value="'+esc(x.country||'')+'"></label></div><label>Stand<input name="stand" value="'+esc(x.stand||'')+'"></label><label>Description EN<textarea name="description_en">'+esc(txt(x.description,'en'))+'</textarea></label><label>Description DE<textarea name="description_de">'+esc(txt(x.description,'de'))+'</textarea></label><input type="hidden" name="current_image_url" value="'+esc(x.image_url||'')+'"><label class="upload-field">Event image'+(x.image_url?'<img class="image-preview" src="'+esc(x.image_url)+'" alt="">':'')+'<input type="file" name="image_file" accept="image/*"></label><label>Status<select name="status"><option '+(x.status==='draft'?'selected':'')+'>draft</option><option '+(x.status==='published'?'selected':'')+'>published</option><option '+(x.status==='archived'?'selected':'')+'>archived</option></select></label><button class="btn primary">Save event</button></form>');
      document.getElementById('eventForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);let imageUrl=f.get('current_image_url')||null;const imageFile=f.get('image_file');if(imageFile&&imageFile.size){try{imageUrl=await uploadAsset(imageFile,'event')}catch(err){alert(err.message||err);return}}const payload={title:{en:f.get('title_en'),de:f.get('title_de')},description:{en:f.get('description_en'),de:f.get('description_de')},starts_on:f.get('starts_on')||null,ends_on:f.get('ends_on')||null,venue:f.get('venue'),location:f.get('location'),country:f.get('country'),stand:f.get('stand'),image_url:imageUrl,status:f.get('status'),updated_by:session.user.id};const res=x.id?await db.from('events').update(payload).eq('id',x.id):await db.from('events').insert({...payload,created_by:session.user.id});if(res.error)alert(res.error.message);else{closeModal();renderEvents()}};
    };
    document.getElementById('newEvent').onclick=()=>edit({});
    panel.querySelectorAll('[data-edit-event]').forEach(b=>b.onclick=()=>edit(data.find(x=>String(x.id)===b.dataset.editEvent)));
  }

  async function renderDocuments(){
    const {data,error}=await db.from('documents').select('*,products(name)').order('created_at',{ascending:false}); if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><h2>Documents</h2><button id="newDoc" class="btn primary">+ Add document</button></div>'+(data.length?'<div class="table-wrap"><table><thead><tr><th>Document</th><th>Type</th><th>Product</th><th>Language</th><th></th></tr></thead><tbody>'+data.map(x=>'<tr><td><a href="'+esc(x.file_url)+'" target="_blank">'+esc(x.title)+'</a></td><td>'+esc(x.document_type)+'</td><td>'+esc(x.products?.name||'—')+'</td><td>'+esc(x.language||'—')+'</td><td><button class="icon-btn" data-delete-doc="'+x.id+'">Delete</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No documents yet.</div>')+'</div>';
    document.getElementById('newDoc').onclick=async()=>{
      const {data:products}=await db.from('products').select('id,name').order('name');
      openModal('<h2>Add document</h2><form id="docForm" class="stack"><label>Title<input name="title" required></label><div class="grid-2"><label>Type<select name="document_type"><option>brochure</option><option>coa</option><option>specification</option><option>certificate</option><option>sds</option><option>other</option></select></label><label>Language<select name="language"><option>en</option><option>de</option><option>multi</option></select></label></div><label>Product<select name="product_id"><option value="">General</option>'+(products||[]).map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label><label class="upload-field">Choose document<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" required></label><button class="btn primary">Save document</button></form>');
      document.getElementById('docForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const file=f.get('file');try{const fileUrl=await uploadAsset(file,'document');const {error}=await db.from('documents').insert({title:f.get('title'),document_type:f.get('document_type'),language:f.get('language'),product_id:f.get('product_id')||null,file_url:fileUrl,created_by:session.user.id});if(error)throw error;closeModal();renderDocuments()}catch(err){alert(err.message||err)}};
    };
    panel.querySelectorAll('[data-delete-doc]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this document record?'))return;await db.from('documents').delete().eq('id',b.dataset.deleteDoc);renderDocuments()});
  }

  async function renderInquiries(){
    const {data,error}=await db.from('inquiries').select('*').order('created_at',{ascending:false}); if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><h2>Website inquiries</h2></div>'+(data.length?'<div class="table-wrap"><table><thead><tr><th>Contact</th><th>Interest</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>'+data.map(x=>'<tr><td><strong>'+esc(x.name)+'</strong><br>'+esc(x.company||'')+'<br><a href="mailto:'+esc(x.email)+'">'+esc(x.email)+'</a><br><small>'+fmt(x.created_at)+'</small></td><td>'+esc(x.product||x.species||'—')+'</td><td>'+esc(x.message).slice(0,180)+'</td><td><span class="pill">'+esc(x.status)+'</span></td><td><button class="icon-btn" data-inquiry="'+x.id+'">Open</button></td></tr>').join('')+'</tbody></table></div>':'<div class="empty">No inquiries yet.</div>')+'</div>';
    panel.querySelectorAll('[data-inquiry]').forEach(b=>b.onclick=()=>{
      const x=data.find(y=>String(y.id)===b.dataset.inquiry);
      openModal('<h2>'+esc(x.company||x.name)+'</h2><p><strong>'+esc(x.name)+'</strong> · '+esc(x.email)+' · '+esc(x.phone||'')+'</p><p>'+esc(x.country||'')+' · '+esc(x.target_market||'')+' · '+esc(x.product||'')+'</p><div class="card"><p>'+esc(x.message)+'</p></div><form id="inqForm" class="stack"><label>Status<select name="status"><option '+(x.status==='new'?'selected':'')+'>new</option><option '+(x.status==='in_progress'?'selected':'')+'>in_progress</option><option '+(x.status==='closed'?'selected':'')+'>closed</option><option '+(x.status==='spam'?'selected':'')+'>spam</option></select></label><label>Internal notes<textarea name="internal_notes" rows="5">'+esc(x.internal_notes||'')+'</textarea></label><button class="btn primary">Save</button></form>');
      document.getElementById('inqForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const {error}=await db.from('inquiries').update({status:f.get('status'),internal_notes:f.get('internal_notes'),updated_at:new Date().toISOString()}).eq('id',x.id);if(error)alert(error.message);else{closeModal();renderInquiries()}};
    });
  }

  async function renderMedia(){
    const {data,error}=await db.storage.from('bregan-media').list('',{limit:100,sortBy:{column:'created_at',order:'desc'}}); if(error)throw error;
    const files=(data||[]).filter(x=>x.name!=='.emptyFolderPlaceholder');
    panel.innerHTML='<div class="card"><div class="card-head"><div><h2>Media library</h2><p class="muted">Upload images and documents here. Editors can also upload files directly while editing products, events and pages.</p></div><label class="btn primary">+ Upload<input id="mediaUpload" type="file" multiple hidden></label></div><div class="media-grid">'+
      files.map(x=>{const url=db.storage.from('bregan-media').getPublicUrl(x.name).data.publicUrl;const image=/\.(png|jpe?g|webp|gif|svg)$/i.test(x.name);return '<div class="media-item">'+(image?'<img src="'+esc(url)+'" alt="">':'<div class="empty">FILE</div>')+'<div><strong>'+esc(x.name)+'</strong><br><a class="icon-btn" href="'+esc(url)+'" target="_blank">Open</a> <button class="icon-btn" data-delete-media="'+esc(x.name)+'">Delete</button></div></div>'}).join('')+
      '</div></div>';
    document.getElementById('mediaUpload').onchange=async e=>{for(const file of e.target.files){try{await uploadAsset(file,'library')}catch(err){alert(err.message||err);break}}renderMedia()};
    panel.querySelectorAll('[data-delete-media]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this media file? Existing pages using it may lose the image.'))return;const {error}=await db.storage.from('bregan-media').remove([b.dataset.deleteMedia]);if(error)alert(error.message);else renderMedia()});
  }
  async function renderTeam(){
    if(!allowed('super_admin')){panel.innerHTML='<div class="card">'+notice('Only Super Admin can manage team access.')+'</div>';return}
    const {data,error}=await db.from('profiles').select('*').order('created_at'); if(error)throw error;
    panel.innerHTML='<div class="card"><div class="card-head"><div><h2>Team access</h2><p class="muted">Create staff accounts here. They are confirmed immediately and can sign in directly — no email confirmation or localhost redirect.</p></div><button id="addTeamUser" class="btn primary">+ Add user</button></div><div class="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Active</th><th></th></tr></thead><tbody>'+
      data.map(x=>'<tr><td><strong>'+esc(x.full_name||'Unnamed')+'</strong><br>'+esc(x.email||x.id)+'</td><td><select data-role="'+x.id+'"><option '+(x.role==='viewer'?'selected':'')+'>viewer</option><option '+(x.role==='sales'?'selected':'')+'>sales</option><option '+(x.role==='marketing'?'selected':'')+'>marketing</option><option '+(x.role==='super_admin'?'selected':'')+'>super_admin</option></select></td><td><input type="checkbox" data-active="'+x.id+'" '+(x.active?'checked':'')+'></td><td><button class="icon-btn" data-save-user="'+x.id+'">Save</button></td></tr>').join('')+
      '</tbody></table></div></div>';

    document.getElementById('addTeamUser').onclick=()=>{
      openModal('<h2>Add staff user</h2><p class="muted">Create the account with a temporary password. The user can sign in immediately.</p>'+
        '<form id="addTeamUserForm" class="stack"><label>Full name<input name="full_name" required></label><label>Email<input name="email" type="email" required></label>'+
        '<label>Temporary password<input name="password" type="password" minlength="8" required></label>'+
        '<label>Role<select name="role"><option value="viewer">Viewer</option><option value="sales">Sales</option><option value="marketing">Marketing</option><option value="super_admin">Super Admin</option></select></label>'+
        '<button class="btn primary">Create user</button></form>');
      document.getElementById('addTeamUserForm').onsubmit=async e=>{
        e.preventDefault();const ff=new FormData(e.currentTarget);e.submitter.disabled=true;e.submitter.textContent='Creating…';
        const {data,error}=await db.functions.invoke('create-cms-user',{body:{full_name:ff.get('full_name'),email:ff.get('email'),password:ff.get('password'),role:ff.get('role')}});
        if(error){alert(error.message);e.submitter.disabled=false;e.submitter.textContent='Create user';return}
        if(data?.error){alert(data.error);e.submitter.disabled=false;e.submitter.textContent='Create user';return}
        closeModal();await renderTeam();
      };
    };

    panel.querySelectorAll('[data-save-user]').forEach(b=>b.onclick=async()=>{
      const id=b.dataset.saveUser;
      const role=panel.querySelector('[data-role="'+id+'"]').value;
      const active=panel.querySelector('[data-active="'+id+'"]').checked;
      const {error}=await db.from('profiles').update({role,active,updated_at:new Date().toISOString()}).eq('id',id);
      if(error)alert(error.message);else b.textContent='Saved';
    });
  }
  async function renderSettings(){
    if(!allowed('super_admin','marketing')){
      panel.innerHTML='<div class="card">'+notice('Settings are available to Super Admin and Marketing users.')+'</div>';
      return;
    }
    const {data,error}=await db.from('site_settings').select('*').order('key'); if(error)throw error;
    const byKey=Object.fromEntries((data||[]).map(x=>[x.key,x.value||{}]));
    const visuals=byKey.visuals||{};
    const brand=byKey.brand||{};
    const languages=byKey.languages||{enabled:['en','de'],default:'en'};
    const visualFields=[
      ['logo','Bregan logo'],['hero','Homepage hero'],['page_hero','Inner page hero'],['poultry','Poultry'],['ruminant','Ruminant'],
      ['aqua','Aquaculture'],['feedmills','Feed mill'],['journey','Journey section'],['story_factory','Company / factory'],
      ['explore_1','Explore image 1'],['explore_2','Explore image 2'],['explore_3','Explore image 3']
    ];
    panel.innerHTML=
      '<div class="card"><div class="card-head"><div><h2>Company settings</h2><p class="muted">Normal form fields only — no code editing.</p></div></div>'+
      '<form id="generalSettingsForm" class="stack"><div class="grid-2"><label>Company name<input name="company" value="'+esc(brand.company||'Bregan B.V.')+'"></label>'+
      '<label>Contact email<input name="email" type="email" value="'+esc(brand.email||'info@bregan.nl')+'"></label></div>'+
      '<label>Location<input name="location" value="'+esc(brand.location||'Breda · The Netherlands')+'"></label>'+
      '<div class="grid-2"><label>Default language<select name="default"><option value="en" '+(languages.default==='en'?'selected':'')+'>English</option><option value="de" '+(languages.default==='de'?'selected':'')+'>Deutsch</option></select></label>'+
      '<label>Enabled languages<div><label><input type="checkbox" name="lang_en" '+((languages.enabled||[]).includes('en')?'checked':'')+'> English</label> <label><input type="checkbox" name="lang_de" '+((languages.enabled||[]).includes('de')?'checked':'')+'> Deutsch</label></div></label></div>'+
      '<button class="btn primary">Save company settings</button></form></div>'+
      '<div class="card"><div class="card-head"><div><h2>Website images</h2><p class="muted">Choose a new file only for the images you want to replace.</p></div></div>'+
      '<form id="visualSettingsForm" class="stack"><div class="visual-grid">'+visualFields.map(([key,label])=>
        '<div class="visual-card"><h3>'+esc(label)+'</h3>'+(visuals[key]?'<img class="image-preview" src="'+esc(visuals[key])+'" alt="">':'')+
        '<label class="upload-field">Choose new image<input type="file" name="'+esc(key)+'" accept="image/*"></label></div>'
      ).join('')+'</div><button class="btn primary">Upload selected images</button></form></div>';

    document.getElementById('generalSettingsForm').onsubmit=async e=>{
      e.preventDefault();const ff=new FormData(e.currentTarget);
      const enabled=[];if(ff.get('lang_en'))enabled.push('en');if(ff.get('lang_de'))enabled.push('de');
      if(!enabled.length){alert('Enable at least one language.');return}
      const now=new Date().toISOString();
      const rows=[
        {key:'brand',value:{company:ff.get('company'),email:ff.get('email'),location:ff.get('location')},updated_by:session.user.id,updated_at:now},
        {key:'languages',value:{enabled,default:ff.get('default')},updated_by:session.user.id,updated_at:now}
      ];
      const {error}=await db.from('site_settings').upsert(rows);
      if(error)alert(error.message);else e.submitter.textContent='Saved';
    };

    document.getElementById('visualSettingsForm').onsubmit=async e=>{
      e.preventDefault();const ff=new FormData(e.currentTarget);const next={...visuals};let changed=0;
      try{
        for(const [key] of visualFields){
          const file=ff.get(key);
          if(file&&file.size){next[key]=await uploadAsset(file,'visual-'+key);changed++}
        }
        if(!changed){alert('Choose at least one image.');return}
        const {error}=await db.from('site_settings').upsert({key:'visuals',value:next,updated_by:session.user.id,updated_at:new Date().toISOString()});
        if(error)throw error;
        await renderSettings();
      }catch(err){alert(err.message||err)}
    };
  }

  bootstrap().catch(err=>{authMessage.textContent=err.message});
})();