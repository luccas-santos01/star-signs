# Pokémon Skill Tree - Star Signs

Uma calculadora interativa de árvore de habilidades com temática Pokémon, criada com Vite e JavaScript vanilla.

## 🚀 Demo

[Veja a aplicação funcionando](https://luccas-santos01.github.io/star-signs/)

## 🎯 Funcionalidades

- ✨ Três árvores de habilidades temáticas (Ho-Oh, Celebi, Lugia)
- 🌍 Suporte a múltiplos idiomas (Português, Inglês, Espanhol)
- 📱 Design responsivo para desktop, tablet e mobile
- 🎮 Interações dinâmicas com animações
- 💾 Persistência de progresso no localStorage
- 🎨 Efeitos de partículas animadas

## 🛠️ Tecnologias Utilizadas

- **Vite** - Build tool e bundler
- **JavaScript ES6+** - Linguagem principal
- **CSS3** - Estilização e animações
- **Particles.js** - Efeitos de partículas
- **GitHub Pages** - Hospedagem

## 🏗️ Como executar localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/luccas-santos01/star-signs.git
   cd star-signs
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abra no navegador:**
   - A aplicação estará disponível em `http://localhost:3000`

## 📦 Build para produção

```bash
npm run build
```

Os arquivos compilados ficarão na pasta `dist/`.

## 🚀 Deploy no GitHub Pages

1. **Configure o repositório no GitHub**
2. **Atualize o `vite.config.js`** com o nome correto do seu repositório
3. **Push para a branch main** - o deploy será automático via GitHub Actions

## 📁 Estrutura do Projeto

```
star-signs/
├── public/                  # Assets estáticos
│   ├── *.png               # Imagens do jogo
│   └── particles.json      # Configuração de partículas
├── src/
│   ├── data.js             # Dados das árvores de habilidades
│   ├── main.js             # Lógica principal
│   ├── translate.js        # Sistema de tradução
│   └── skill_translation.js # Traduções das habilidades
├── index.html              # Arquivo principal
├── vite.config.js          # Configuração do Vite
└── package.json            # Dependências do projeto
```

## 🎮 Como usar

1. **Selecione um idioma** usando as bandeiras no topo
2. **Escolha uma árvore** clicando nos ícones dos Pokémon lendários
3. **Clique nos nodos** para ativar/desativar habilidades
4. **Visualize estatísticas** no painel lateral
5. **Use o botão Reset** para limpar todas as seleções

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🎨 Créditos

- Design inspirado em jogos de RPG e árvores de talentos
- Temática baseada no universo Pokémon
- Efeitos visuais com Particles.js