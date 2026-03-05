# Deployment Manifest: Tempus Victa on Windows Azure (Caddy Edition)

**Objective**: Deploy Tempus Victa to a Windows Server VM using Caddy as a reverse proxy and automated SSL handler.

---

### Phase 1: Identity & Security

- [x] **DNS**: Point `A` record for `tempusvicta.com` to `172.183.153.240`. (VERIFIED)
- [ ] **GCP**: Add `https://tempusvicta.com` to Authorized JavaScript origins.
- [ ] **GCP**: Add `https://tempusvicta.com/api/auth/callback/google` to Authorized redirect URIs.
- [ ] **Firewall**: In Azure Portal, ensure Port `80` and `443` are open for HTTP/HTTPS.

---

### Phase 2: Windows VM Environment Setup

- [x] **Caddy**: Installed and configured. (VERIFIED)
- [ ] **Node.js**: Install Node.js 20.x (Windows Installer).
- [ ] **NSSM**: Download [NSSM](https://nssm.cc/download) and place it in your System Path.

---

### Phase 3: Deployment & Execution

- [ ] **Clone**: Pull the code to `C:\Projects\tempus_victa`.
- [ ] **Build**: Run `npm install` and `npm run build`.
- [ ] **Create Service (NSSM)**: 
    - Run `nssm install TempusVicta`.
    - Path: `C:\Program Files\nodejs\node.exe`
    - Startup directory: `C:\Projects\tempus_victa`
    - Arguments: `node_modules\next\dist\bin\next start -p 3010`
- [ ] **Caddy Start**: Run `caddy run --config Caddyfile` (or as a service).

---

**The system is sovereign. The user is in control.**
