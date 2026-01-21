# 📹 Guia Rápido: Adicionar Vídeos do Instagram

## Como Funciona

Seus vídeos do Instagram vão aparecer **direto no site**, permitindo que visitantes assistam sem sair da página!

## Passo a Passo Completo

### 1️⃣ Escolha o Post no Instagram

- Abra o Instagram
- Vá até o post/vídeo que quer adicionar
- Pode ser: Reels, Vídeo normal, Carrossel

### 2️⃣ Copie o Link

**No celular:**
1. Toque nos 3 pontinhos (...) no post
2. Toque em "Copiar link"

**No computador:**
1. Clique nos 3 pontinhos (...) 
2. Clique em "Copiar link"

Você vai ter algo assim:
```
https://www.instagram.com/p/DBMw8xXSL9k/
```

### 3️⃣ Extraia o ID

O ID é a parte entre `/p/` e o próximo `/`

**Exemplo:**
```
Link completo: https://www.instagram.com/p/DBMw8xXSL9k/
ID: DBMw8xXSL9k
       ↑ Copie só isso ↑
```

### 4️⃣ Cole no index.html

Abra o arquivo `index.html` e procure por:

```html
<!-- Video 1 -->
<div class="video-card">
    <div class="video-thumbnail">
        <iframe 
            src="https://www.instagram.com/p/COLOQUE-O-ID-DO-POST/embed" 
```

Substitua `COLOQUE-O-ID-DO-POST` pelo ID que você copiou:

```html
<iframe 
    src="https://www.instagram.com/p/DBMw8xXSL9k/embed" 
```

### 5️⃣ Atualize Título e Descrição

Logo abaixo do iframe, você vai ver:

```html
<div class="video-info">
    <h3>São Paulo Subterrânea #1</h3>
    <p>Explorando os rios enterrados da cidade</p>
```

Mude para o título real do seu vídeo:

```html
<div class="video-info">
    <h3>Rio Tamanduateí Enterrado</h3>
    <p>Descobrindo o rio que corre sob a Avenida do Estado</p>
```

### 6️⃣ Atualize o Link do Botão

Um pouco mais abaixo:

```html
<a href="https://www.instagram.com/p/SEU-POST-ID/" target="_blank">
```

Substitua `SEU-POST-ID` pelo mesmo ID:

```html
<a href="https://www.instagram.com/p/DBMw8xXSL9k/" target="_blank">
```

### 7️⃣ Repita para os 4 Vídeos

O site tem 4 slots de vídeo. Repita o processo para cada um:

- **Vídeo 1:** Urbex / São Paulo Subterrânea
- **Vídeo 2:** Política / Dinastias
- **Vídeo 3:** Maçonaria
- **Vídeo 4:** Mistérios

## 🎯 Dicas Importantes

### ✅ Posts que Funcionam
- Posts públicos ✓
- Reels ✓
- Vídeos ✓
- Carrosséis ✓

### ❌ Posts que NÃO Funcionam
- Posts privados ✗
- Stories (expiram) ✗
- Lives (não ficam salvos) ✗

### 🔍 Como Testar se Funciona

Antes de colocar no site, teste o embed:

1. Pegue seu ID: `DBMw8xXSL9k`
2. Monte a URL: `https://www.instagram.com/p/DBMw8xXSL9k/embed`
3. Cole no navegador
4. Se abrir uma página com o vídeo = funciona! ✓

## 📝 Template Completo

Aqui está um bloco completo para copiar/colar:

```html
<div class="video-card">
    <div class="video-thumbnail">
        <iframe 
            src="https://www.instagram.com/p/SEU-ID-AQUI/embed" 
            frameborder="0" 
            scrolling="no" 
            allowtransparency="true"
            loading="lazy">
        </iframe>
        <div class="video-overlay">
            <svg class="play-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
        </div>
    </div>
    <div class="video-info">
        <h3>Título do Vídeo</h3>
        <p>Descrição breve do conteúdo</p>
        <a href="https://www.instagram.com/p/SEU-ID-AQUI/" target="_blank" class="video-link">
            Ver no Instagram
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        </a>
    </div>
</div>
```

Só substituir:
- `SEU-ID-AQUI` (2 lugares)
- `Título do Vídeo`
- `Descrição breve do conteúdo`

## 🚨 Erros Comuns

### "Vídeo não aparece"
- ✓ Verifique se o post é público
- ✓ Confira se copiou o ID correto
- ✓ Teste a URL /embed no navegador

### "Vídeo cortado ou estranho"
- O CSS já está otimizado para 9:16 (vertical)
- Funciona perfeitamente com Reels

### "Botão não funciona"
- Verifique se tem o ID no href também
- Precisa estar nos 2 lugares: iframe E link

## 📱 Testando no Site

Depois de adicionar os vídeos:

1. Abra o `index.html` no navegador
2. Role até a seção "Séries no Instagram"
3. Os vídeos devem carregar automaticamente
4. Hover sobre o vídeo = ícone de play aparece
5. Clique no botão = abre no Instagram

## 🎉 Pronto!

Agora seu site tem vídeos clicáveis do Instagram integrados!

Marcas vão adorar poder ver seu trabalho direto no site. 🚀