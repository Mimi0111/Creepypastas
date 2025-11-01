// Simple SPA for Creepypasta site
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

const intro = qs('#intro');
const read = qs('#read');
const add = qs('#add');
const storiesList = qs('#stories-list');
const noStories = qs('#no-stories');

const show = (el)=>{ document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden')); el.classList.remove('hidden'); window.scrollTo(0,0) }

qs('#btn-home').onclick = ()=> show(intro);
qs('#btn-read').onclick = ()=> { renderStories(); show(read); }
qs('#btn-add').onclick = ()=> show(add);
qs('#intro-read').onclick = ()=> { renderStories(); show(read); }
qs('#intro-add').onclick = ()=> show(add);

// Storage key
const STORAGE_KEY = 'creepypasta_stories_v1';

// Helpers
const loadStories = ()=>{
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
const saveStories = (arr)=> localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

// Render stories
function renderStories(){
  const stories = loadStories();
  storiesList.innerHTML = '';
  if(!stories.length){ noStories.style.display='block'; return }
  noStories.style.display='none';
  stories.slice().reverse().forEach(s=>{
    const card = document.createElement('article');
    card.className = 'story-card';
    const h = document.createElement('h3'); h.textContent = s.title;
    const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${s.author ? s.author + ' • ' : ''}${new Date(s.created).toLocaleString()}`;
    const p = document.createElement('p'); p.textContent = s.content;
    card.appendChild(h); card.appendChild(meta); card.appendChild(p);

    if(s.photo){ const img = document.createElement('img'); img.src = s.photo; img.style.maxWidth='100%'; img.style.borderRadius='8px'; card.appendChild(img) }
    if(s.video){ const vid = document.createElement('video'); vid.controls=true; vid.src = s.video; vid.style.maxWidth='100%'; card.appendChild(vid) }
    if(s.audio){ const aud = document.createElement('audio'); aud.controls=true; aud.src = s.audio; card.appendChild(aud) }

    storiesList.appendChild(card);
  });
}

// Form behavior
const storyForm = qs('#story-form');
const photoInput = qs('#photo'), videoInput=qs('#video'), audioInput=qs('#audio');
const mediaPreview = qs('#media-preview');
const useGithub = qs('#use-github'), ghSettings = qs('#github-settings');
useGithub.addEventListener('change', ()=> { ghSettings.classList.toggle('hidden', !useGithub.checked) });

// preview files
const toDataURL = (file)=> new Promise((res,rej)=>{
  const reader = new FileReader();
  reader.onload = ()=>res(reader.result);
  reader.onerror = ()=>rej();
  reader.readAsDataURL(file);
});
async function updatePreview(){
  mediaPreview.innerHTML = '';
  if(photoInput.files[0]){
    const url = await toDataURL(photoInput.files[0]);
    const img = document.createElement('img'); img.src = url; img.style.maxWidth='240px'; mediaPreview.appendChild(img);
  }
  if(videoInput.files[0]){
    const url = await toDataURL(videoInput.files[0]);
    const vid = document.createElement('video'); vid.controls=true; vid.src=url; vid.style.maxWidth='320px'; mediaPreview.appendChild(vid);
  }
  if(audioInput.files[0]){
    const url = await toDataURL(audioInput.files[0]);
    const aud = document.createElement('audio'); aud.controls=true; aud.src=url; mediaPreview.appendChild(aud);
  }
}
photoInput.addEventListener('change', updatePreview);
videoInput.addEventListener('change', updatePreview);
audioInput.addEventListener('change', updatePreview);

// Submit
storyForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const title = qs('#title').value.trim();
  const author = qs('#author').value.trim();
  const content = qs('#content').value.trim();
  const feedback = qs('#form-feedback');
  if(!title || !content){ feedback.textContent = 'El título y el texto son obligatorios.'; return; }
  feedback.textContent = 'Procesando...';

  let photo=null, video=null, audio=null;
  if(photoInput.files[0]) photo = await toDataURL(photoInput.files[0]);
  if(videoInput.files[0]) video = await toDataURL(videoInput.files[0]);
  if(audioInput.files[0]) audio = await toDataURL(audioInput.files[0]);

  const story = { title, author, content, photo, video, audio, created: new Date().toISOString() };

  if(useGithub.checked){
    // Gather GitHub info
    const owner = qs('#gh-owner').value.trim();
    const repo = qs('#gh-repo').value.trim();
    let path = qs('#gh-path').value.trim();
    const token = qs('#gh-token').value.trim();
    if(!owner||!repo||!token){ feedback.textContent = 'Para publicar en GitHub debes rellenar owner, repo y token.'; return; }
    if(!path) path = 'stories/';
    if(!path.endsWith('/')) path += '/';
    feedback.textContent = 'Publicando en GitHub...';
    try{
      // Prepare markdown content
      let md = `---\ntitle: "${title.replace(/"/g,'\\"')}"\nauthor: "${author.replace(/"/g,'\\"')}"\ndate: ${new Date().toISOString()}\n---\n\n${content}\n\n`;
      if(photo) md += `![foto](data:image;base64,${photo.split(',')[1]})\n\n`;
      if(video) md += `<video controls src="data:video;base64,${video.split(',')[1]}"></video>\n\n`;
      if(audio) md += `<audio controls src="data:audio;base64,${audio.split(',')[1]}"></audio>\n\n`;

      const filename = `${path}${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}.md`;

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filename)}`;
      const body = {
        message: `Publish creepypasta: ${title}`,
        content: btoa(unescape(encodeURIComponent(md)))
      };
      const resp = await fetch(url, {
        method:'PUT',
        headers:{
          Authorization: 'token ' + token,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type':'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if(resp.ok){
        feedback.innerHTML = 'Publicado en GitHub correctamente. Verifica tu repo para el archivo: ' + filename;
        // Also save local copy
        const arr = loadStories(); arr.push(story); saveStories(arr);
        storyForm.reset(); mediaPreview.innerHTML=''; renderStories(); show(read);
      } else {
        feedback.textContent = 'Error publicando en GitHub: ' + (data.message || JSON.stringify(data));
      }
    }catch(err){
      feedback.textContent = 'Error al conectar con GitHub: ' + err.message;
    }
  } else {
    // Save locally
    const arr = loadStories(); arr.push(story); saveStories(arr);
    feedback.textContent = 'Historia guardada localmente. Puedes verla en "Leer historias".';
    storyForm.reset(); mediaPreview.innerHTML=''; renderStories(); show(read);
  }
});

// Save local button
qs('#btn-save-local').addEventListener('click', ()=>{
  const title = qs('#title').value.trim();
  const author = qs('#author').value.trim();
  const content = qs('#content').value.trim();
  const feedback = qs('#form-feedback');
  if(!title||!content){ feedback.textContent = 'Título y texto obligatorios.'; return; }
  // Only basic save: no files
  const story = { title, author, content, photo:null, video:null, audio:null, created:new Date().toISOString() };
  const arr = loadStories(); arr.push(story); saveStories(arr);
  feedback.textContent = 'Guardado localmente (sin archivos). Para incluir multimedia, usa el formulario y publica.';
  storyForm.reset(); mediaPreview.innerHTML=''; renderStories(); show(read);
});

// Initialize
renderStories();
