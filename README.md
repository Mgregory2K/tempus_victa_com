# Tempus Victa // Cognitive OS

**Operational Status: v2.9 (Windows Azure + Caddy)**

Tempus Victa is a local-first cognitive operating system. This document outlines the deployment to a **Windows Server** environment using **Caddy** for automated SSL and reverse proxying.

## 🧬 Deployment Specs (Windows Azure VM)

- **Domain**: [https://tempusvicta.com](https://tempusvicta.com) (Points to `172.183.153.240`)
- **Environment**: Windows Server
- **Reverse Proxy**: Caddy (Automated SSL + HTTP/3)
- **Process Manager**: NSSM (Non-Sucking Service Manager)

## 🚀 Windows Server Deployment Workflow

**1. Clone & Build:**
- Clone the repository using Git for Windows.
- Run `npm install` and `npm run build`.

**2. Configure Production Secrets (.env.local):**
```env
# This MUST be the public domain. localhost will not work for Google OAuth.
NEXTAUTH_URL=https://tempusvicta.com

# Generate a new secret for production
# `openssl rand -base64 32`
NEXTAUTH_SECRET=[generate-new-secret]

# Google & AI Keys
GOOGLE_CLIENT_ID=[your-id]
GOOGLE_CLIENT_SECRET=[your-secret]
OPENAI_API_KEY=[your-key]
```

**3. Create a Windows Service (NSSM):**
- Use NSSM to create a service that runs the `npm run start` command from the application directory. This ensures the app runs 24/7 in the background.
- Command: `nssm install TempusVicta`
- Arguments: `node_modules\next\dist\bin\next start -p 3010`

**4. Configure Caddy:**
- Update your `Caddyfile`:
```caddy
https://tempusvicta.com {
  reverse_proxy 127.0.0.1:3010
}
```
- Caddy automatically handles SSL (Let's Encrypt) and redirects.

---
*"Sovereignty is not a feature; it is the architecture."*
