# Deploy checklist

- [ ] `npm run build` succeeds  
- [ ] `.env` secrets present (never commit)  
- [ ] Database migrate if `DATABASE_URL` set  
- [ ] Health: `GET /api/health`  
- [ ] Status: public status page  
- [ ] Rate limits configured  
- [ ] Audit log stdout or SIEM sink  
