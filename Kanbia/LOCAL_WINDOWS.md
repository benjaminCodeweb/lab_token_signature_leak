# Kanbia: modo local liviano (Windows, sin Docker)

Este modo sirve React compilado y la API Express desde **un solo proceso Node.js**. SQLite se guarda en `Kanbia/data/kanbia.db`. No requiere Docker Desktop, PostgreSQL ni Redis.

## Requisitos

- Windows PowerShell
- Node.js 22 LTS x64 (compatible con Node.js 20+ y npm)
- Conexión a Internet solo para la primera instalación de dependencias

## Iniciar

Desde la carpeta `Kanbia`:

```powershell
.\start-local.ps1
```

Si PowerShell bloquea la ejecución de scripts, para esa sesión únicamente:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-local.ps1
```

La primera ejecución instala las dependencias de `client` y `server`, compila ambos y abre un único servidor. Las siguientes ejecuciones reutilizan dependencias y compilaciones, por lo que arrancan más rápido.

- App: http://localhost:1000
- API health: http://localhost:1000/api/health
- Writeup: http://localhost:1000/writeup
- Usuario: `attacker@kanbia.local`
- Contraseña: `password123`
- Detener: Ctrl+C

Para recompilar después de cambios:

```powershell
.\start-local.ps1 -Rebuild
```

Para borrar e instalar de nuevo dependencias (por ejemplo, tras cambiar de versión de Node):

```powershell
.\start-local.ps1 -Reinstall
```

## Notas

- La instalación inicial sigue necesitando `npm install`; no elimina la descarga de paquetes ni posibles problemas de conectividad npm.
- El backend depende de `better-sqlite3`, un módulo nativo. Usá Node.js x64. Si falta un binario compatible, npm puede requerir herramientas de compilación C++ para Windows.
- El proceso escucha únicamente en `127.0.0.1` para no exponer por red un laboratorio deliberadamente vulnerable.
- La clave JWT de demostración y el comportamiento del laboratorio se mantienen sin cambios.
- **Al reiniciar la aplicación, la base SQLite se elimina y se vuelve a generar**: es el comportamiento original de `database.ts`.
- No uses esta configuración en servicios públicos o de producción.

Docker continúa funcionando como alternativa mediante `autodeploy.ps1`.

## Acceso desde Burp Suite en otra máquina o Kali virtualizada

Desde Windows, averiguá la IPv4 de la interfaz que alcanza tu máquina Kali/Burp:

```powershell
ipconfig
```

Por ejemplo, si Windows tiene IP `192.168.1.50`, iniciá Kanbia así:

```powershell
.\start-local.ps1 -BindAddress 192.168.1.50
```

Desde Kali o Burp abrí `http://192.168.1.50:1000`. Ambas máquinas deben tener conectividad de red. Usá el navegador integrado de Burp o configurá el proxy para interceptar las solicitudes.

Si Windows Firewall impide el acceso, autorizá temporalmente el TCP/1000 **solo en red privada y solo desde la IP de Kali**; cerrá esa regla al finalizar. No hagas port forwarding desde Internet ni utilices una red pública compartida: este laboratorio contiene fallas de seguridad intencionales.

El valor predeterminado sigue siendo `127.0.0.1`, accesible únicamente desde el equipo que ejecuta Kanbia.
