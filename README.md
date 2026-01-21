# Site Iuri Piragibe - Versão 3.0 Final

Site profissional completo com **vídeos do Instagram integrados** e **Media Kit interativo**.

## ✅ Correções incluídas (mobile + SEO)

- **Scroll horizontal no mobile**: ajustes em `styles.css` para evitar overflow (root `overflow-x: clip`, embeds responsivos e transforms desativados em touch).
- **SEO**:
  - Canonical/OG/Twitter alinhados com `https://iuripiragibe.net`
  - `sitemap.xml` limpo (sem fragmentos `#...`, que não são consumidos por buscadores)
  - Ícones e manifest (`favicon.svg`, `site.webmanifest`, `og-image.svg`)

## 🎥 Como Adicionar Seus Vídeos do Instagram

### Passo 1: Pegar o Link do Post
1. Abra o post no Instagram
2. Clique nos 3 pontinhos (...)
3. Selecione "Copiar link"
4. Exemplo: `https://www.instagram.com/p/ABC123XYZ/`

### Passo 2: Extrair o ID do Post
O ID é a parte entre `/p/` e `/`
- Link: `https://www.instagram.com/p/ABC123XYZ/`
- ID: `ABC123XYZ`

### Passo 3: Editar o index.html
Procure por esta linha (tem 4 vídeos):
```html
<iframe src="https://www.instagram.com/p/COLOQUE-O-ID-DO-POST/embed"
```

Substitua `COLOQUE-O-ID-DO-POST` pelo ID real:
```html
<iframe src="https://www.instagram.com/p/ABC123XYZ/embed"
```

### Passo 4: Atualizar Título e Descrição
```html
<h3>São Paulo Subterrânea #1</h3>  <!-- Mude o título -->
<p>Explorando os rios enterrados da cidade</p>  <!-- Mude a descrição -->
```

### Passo 5: Atualizar o Link
```html
<a href="https://www.instagram.com/p/ABC123XYZ/" target="_blank">
```

## 📧 Email Atualizado

O email já está configurado como **iuri@piragibe.com.br** em:
- Meta tags (Schema.org)
- Links de contato
- Botão do Media Kit
- Seção de contato

## 📊 Media Kit Integrado

O site agora tem um **Media Kit completo** com:

✅ **Visão Geral** - Números principais em destaque  
✅ **Demografia** - Idade, gênero, localização com gráficos visuais  
✅ **Tipos de Conteúdo** - Formatos que você produz  
✅ **Opções de Parceria** - 3 pacotes com precificação  
✅ **Marcas Ideais** - Categorias perfeitas para colaboração  
✅ **Valores** - Seus compromissos editoriais  
✅ **CTA para Download** - Botão para solicitar PDF completo  

### Como Personalizar o Media Kit

No `index.html`, procure a seção `<!-- Media Kit Section -->` (linha ~380):

**Atualizar números:**
```html
<div class="overview-number">40K+</div>  <!-- Seus seguidores reais -->
```

**Mudar precificação:**
```html
<div class="price-tag">A partir de R$ 3.000</div>  <!-- Seu preço -->
```

**Adicionar categorias de marca:**
```html
<div class="brand-category">
    <h4>Sua Categoria</h4>
    <p>Descrição das marcas</p>
</div>
```

## 🚀 Deploy

1. **Extraia o ZIP**
2. **Edite os IDs dos vídeos** (passo a passo acima)
3. **Faça upload no Netlify/Vercel**
4. **Configure domínio iuripiragibe.net**

## 🧪 Testes automatizados (anti-regressão)

Requisitos: Node.js 20+

```bash
npm install
npm test
```

Os testes verificam:
- ausência de **scroll horizontal** em viewport mobile
- presença de **tags SEO básicas** (title/canonical/robots/og:url)

## ✨ Novidades da V3

✅ Seção de vídeos com embeds do Instagram  
✅ Media Kit completo e interativo  
✅ Email atualizado (iuri@piragibe.com.br)  
✅ Precificação de parcerias  
✅ Demografia visual com gráficos  
✅ CTA para solicitar PDF do media kit  
✅ Design ainda mais polido  

## 📱 Exemplo de Vídeos

Os 4 slots de vídeo estão prontos para:
1. **São Paulo Subterrânea** - Urbex
2. **Dinastias Políticas** - Investigação política
3. **Maçonaria** - Sociedades secretas
4. **Mistérios Urbanos** - Casos brasileiros

Basta substituir os IDs!

## 🎨 Customização Rápida

### Mudar números do Media Kit
Procure por `.overview-number` no HTML e atualize.

### Adicionar mais vídeos
Copie um `.video-card` inteiro e cole abaixo, depois edite o conteúdo.

### Ajustar preços
Procure por `.price-tag` e modifique os valores.

## 📄 Estrutura de Arquivos

```
iuri-piragibe-v3/
├── index.html       # Página com vídeos + media kit
├── sobre.html       # Página autoral para rankear 'Piragibe' + livro
├── mapa-dinastias.html # Mapa interativo das dinastias políticas
├── styles.css       # CSS com estilos para vídeos/mediakit
├── script.js        # JavaScript
├── robots.txt       # SEO
├── sitemap.xml      # SEO
├── site.webmanifest # PWA
├── og-image.svg     # Open Graph/Twitter image
├── favicon.svg      # Favicon
├── apple-touch-icon.svg # Ícone iOS
└── README.md        # Este arquivo
```

## 🎯 Próximos Passos

1. **Adicione os IDs dos seus vídeos** (5 minutos)
2. **Revise os números do media kit** (são estimativas)
3. **Faça deploy**
4. **Compartilhe o link #mediakit com marcas**

## 💡 Dica Pro

Quando enviar proposta para marcas, mande:
> "Veja nosso media kit completo: https://iuripiragibe.net/#mediakit"

Eles vão ver tudo profissionalmente organizado!

## 📞 Suporte

Problemas com embeds do Instagram?
- Verifique se o post é público
- Teste o ID diretamente: instagram.com/p/SEU-ID/embed
- Limpe cache do navegador

---

**Tudo pronto para impressionar marcas e conseguir parcerias! 🚀**

## ⬆️ Publicar no GitHub (repo vazio)

O repositório `savantarmorer/newrepo` está vazio (GitHub mostra “This repository is empty”: `https://github.com/savantarmorer/newrepo`).

Para enviar os arquivos:

```bash
git init
git add .
git commit -m "chore: initial site + mobile overflow fix + SEO + tests"
git branch -M main
git remote add origin https://github.com/savantarmorer/newrepo.git
git push -u origin main
```

## 🔗 Novas páginas
- `sobre.html`: foco em SEO para “Piragibe”, inclui CTA para prévia do livro na Amazon.
- `mapa-dinastias.html`: mapa interativo com dinastias (Sarney, Calheiros, Barbalho, Magalhães, Gomes).