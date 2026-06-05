## Summary

- Fix infinite page reload when BGG-Admin runs alongside bgggarage-api.
- Boot on login screen without token; restore session from `localStorage` after login.
- On 401, clear session via React auth context instead of `window.location.href`.

## Test plan

- [ ] API on, clear storage → login screen, no reload loop
- [ ] Login as admin → dashboard stable, quotes load
- [ ] F5 → still logged in
- [ ] Logout → login, storage empty
- [ ] Invalid token in storage → login + “Sessão expirada” toast, no loop
- [ ] API off → no reload loop
