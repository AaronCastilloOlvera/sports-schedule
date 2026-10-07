# Deploy a AWS — registro de lo que se hizo

Bitácora de la primera vez que se desplegó este frontend a AWS (S3 + CloudFront), en paralelo al frontend que ya corría en Railway. Para la guía completa con el "por qué" de cada cosa, ver [`aws_deployment.md`](./aws_deployment.md).

## Recursos creados

| Recurso | Nombre / valor |
|---|---|
| Usuario IAM | `sports-schedule-deploy` — sin acceso a consola, solo access keys para CLI |
| Permisos del IAM user | `AmazonS3FullAccess` + `CloudFrontFullAccess` (de más por simplicidad inicial — pendiente acotar a solo este bucket/distribution) |
| Bucket S3 | `sports-schedule-frontend` (región `us-east-1`), bloqueo de acceso público activado, sin "static website hosting" |
| CloudFront distribution | `sports-schedule-frontend` → `d2xcq9xekucmvp.cloudfront.net` |
| Origin access | "Allow private S3 bucket access to CloudFront" (Origin Access Control) |
| WAF | Desactivado (`Do not enable security protections` — tiene costo fijo mensual, no aplica a un sitio personal) |
| Default root object | `index.html` |
| Error pages | `403 → /index.html (200)` y `404 → /index.html (200)` |

## Pasos seguidos

1. Instalar AWS CLI v2 (`winget install --id Amazon.AWSCLI -e`).
2. Crear usuario IAM `sports-schedule-deploy` en la consola (root solo se usó para este paso).
3. Generar access key del usuario (caso de uso: CLI) y correr `aws configure` localmente.
4. `npm run build` → genera `dist/`.
5. `aws s3 mb s3://sports-schedule-frontend --region us-east-1`.
6. `aws s3 sync dist/ s3://sports-schedule-frontend --delete`.
7. Crear la distribution de CloudFront por consola, apuntando al bucket completo (no a una subcarpeta), con el checkbox de acceso privado activado y WAF desactivado.
8. Configurar `Default root object` y las dos `Error pages` (pasos que el wizard de creación no incluye — se hacen después, ya con la distribution creada).
9. Esperar a que el status pase de "Deploying" a "Enabled".
10. Agregar el dominio de CloudFront a `ALLOWED_ORIGINS` en las variables de Railway (el backend no cambia de código, solo esa env var), conservando los orígenes que ya existían.

## Deploy de una actualización futura

Una vez configurado todo lo anterior, actualizar el sitio es solo:

```bash
npm run build
aws s3 sync dist/ s3://sports-schedule-frontend --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

(El `--distribution-id` se ve en la consola de CloudFront, pestaña General.)

## Pendientes / mejoras futuras

- Acotar los permisos del IAM user de `FullAccess` a solo este bucket/distribution.
- Dominio propio + certificado ACM (hoy se usa el `*.cloudfront.net` gratuito).
- Billing alarm en CloudWatch.
- Automatizar el sync + invalidation con GitHub Actions en cada push a `main`.
