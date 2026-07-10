# 🚀 Fynz - Gerenciador Financeiro

O **Fynz** é uma aplicação completa de gestão financeira pessoal, desenvolvida com **Expo**, **React Native** e **Supabase**, focada em performance, segurança e uma experiência de usuário fluida.

## 🛠 Tecnologias Principais

- **Framework:** Expo (React Native)
- **Roteamento:** Expo Router
- **Backend/DB:** Supabase (Auth, Storage & Database)
- **Gerenciamento de Estado:** React Context API + AsyncStorage
- **Build:** EAS (Expo Application Services)

---

# 📦 Como começar

## Pré-requisitos

Certifique-se de ter instalado:

- [Node.js](https://nodejs.org/)
- [EAS CLI](https://docs.expo.dev/eas/)

## Instalar dependências

```bash
npm install
```

## Iniciar em desenvolvimento

```bash
npx expo start
```

---

# 📦 Builds

## Android (APK de teste)

```bash
eas build --platform android --profile test-production-apk
```

## iOS (IPA de teste)

```bash
eas build --platform ios --profile test-production-ipa
```

---

# 🚀 Guia de Lançamento (Deploy & Produção)

Sempre que for enviar uma atualização para a Google Play ou App Store, siga os passos abaixo.

## 1. Atualizar a versão (`app.json`)

Antes de gerar os builds, incremente:

- `version` (ex.: `1.0.0` → `1.0.1`)
- `android.versionCode` (+1)
- `ios.buildNumber` (+1)

Exemplo:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

---

## 2. Gerar builds de teste

### Android (APK)

```bash
eas build --platform android --profile test-production-apk
```

### iOS (IPA)

```bash
eas build --platform ios --profile test-production-ipa
```

---

## 3. Gerar builds de produção

### Android (AAB)

```bash
eas build --platform android --profile production
```

### iOS (IPA para App Store)

```bash
eas build --platform ios --profile production
```

---

# 🏗 Arquitetura do Projeto

```
app/
├── Rotas e telas do Expo Router

services/
├── Regras de negócio
│   ├── Auth
│   ├── Finance
│   ├── Avatar
│   └── Exportação

repositories/
├── Comunicação direta com o Supabase

cache/
├── Cache de dados

storage/
├── AsyncStorage

lib/
├── Configurações compartilhadas
│   ├── Supabase
│   ├── Cores
│   └── Utilitários
```

---

# 🛡 Segurança e Boas Práticas

### Limpeza de Cache

Ao realizar login ou logout, o aplicativo limpa automaticamente:

- UsuarioCache
- AssinaturaCache
- AsyncStorage

Isso impede que dados da sessão anterior permaneçam no dispositivo.

### Armazenamento de Imagens

Os avatares utilizam o padrão:

```
userId-avatar
```

com:

```
upsert: true
```

Assim, cada usuário mantém apenas um arquivo de avatar no bucket, evitando arquivos duplicados.

### Proteção de Conta

A exclusão da conta é bloqueada quando existe uma assinatura ativa. O usuário deve cancelar a assinatura antes de excluir a conta.

---

# 📁 Comandos Úteis

## Resetar o projeto

```bash
npm run reset-project
```

## Verificar erros de TypeScript

```bash
npx tsc --noEmit
```

---

# 💙 Desenvolvido com foco em alta performance financeira.