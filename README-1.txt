# LiteVault para Netlify

## Publicar
1. Sube el contenido de esta carpeta a un repositorio GitHub o arrastra la carpeta a Netlify.
2. En Netlify, abre Site configuration > Environment variables y crea:
   - DISCORD_CLIENT_ID = tu Application/Client ID
   - DISCORD_CLIENT_SECRET = tu Client Secret (solo en Netlify, nunca en el HTML ni en chats)
   - SESSION_SECRET = una cadena aleatoria larga y privada (32+ bytes)
   - DISCORD_REDIRECT_URI = https://TU-SITIO.netlify.app/.netlify/functions/auth?action=callback
3. En Discord Developer Portal > OAuth2 > Redirects, registra exactamente el valor de DISCORD_REDIRECT_URI.
4. Haz un nuevo deploy después de configurar las variables.

La aplicación solicita únicamente el scope `identify`. No pide ni almacena frases semilla, claves privadas ni contraseñas de Discord.

Nota: el PIN es un bloqueo de interfaz local de demostración, no un sistema de custodia ni una garantía de seguridad fuerte. No lo reutilices para servicios importantes.
