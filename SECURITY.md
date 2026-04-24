# Security Policy

## Reporting a vulnerability

Please do not report security issues in public GitHub issues.

Send details to `security@ailouros.io` with:

- a description of the issue
- affected area or component
- reproduction steps or proof of concept
- impact assessment if known

## Operator notes

- keep `.env` files local
- avoid exposing privileged backend routes to untrusted origins
- set `VITE_API_BASE_URL` explicitly for cross-origin deployments
