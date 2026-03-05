# Deployment Manifest: Tempus Victa on Windows Azure (Caddy Edition)

**Objective**: Deploy Tempus Victa to a Windows Server VM using Caddy as a reverse proxy and automated SSL handler.

---

### Phase 1: Identity & Security

- [ ] **FIREWALL**: In Azure Portal, ensure Inbound Port Rules for `80` (HTTP) and `443` (HTTPS) are **Allowed**. This is required for SSL certificate validation.
- [x] **DNS**: Point `A` record for `tempusvicta.com` to `172.183.153.240`. (VERIFIED)
- [ ] **GCP**: Add `https://tempusvicta.com` to Authorized JavaScript origins.
- [ ] **GCP**: Add `https://tempusvicta.com/api/auth/callback/google` to Authorized redirect URIs.
- [ ] **Service Conflict**: Ensure no other service (PRTG, IIS) is using Port 80/443.

---

### Phase 2: Windows VM Environment Setup

- [x] **Caddy**: Installed and configured. (VERIFIED)
- [ ] **Node.js**: Install Node.js 20.x (Windows Installer).
- [ ] **NSSM**: Download [NSSM](https://nssm.cc/download) and place it in your System Path.

---

### Phase 3: Deployment & Execution

- [ ] **Clone**: Pull the code to `C:\Projects\tempus_victa`.
- [ ] **Build**: Run `npm install` and `npm run build`.
- [ ] **Create Service (NSSM)**: `nssm install TempusVicta`.
- [ ] **Caddy Start**: `caddy run` (for testing) or `caddy start` (for background service).

---

**The system is sovereign. The user is in control.**
