# Proxy Setup

Electron app that automatically sets up a SOCKS5 proxy on your VPS server via SSH.

## Download

Go to [Releases](https://github.com/nnaxim/tg-auto-proxy/releases) and download for your platform:

| Platform | File |
|----------|------|
| Windows  | `Proxy Setup Setup 1.0.0.exe` |
| Linux    | `Proxy Setup-1.0.0.AppImage` |
| macOS    | `Proxy Setup-1.0.0.dmg` |

## How it works

1. Buy any VPS with Ubuntu or Debian
2. Open the app
3. Enter your server IP, login, password and ports
4. Click **Setup**
5. The app connects via SSH and automatically installs and configures Dante SOCKS5 proxy
6. Configure Telegram with the provided credentials

## Configure Telegram

After setup is complete:
```
Settings - Advanced - Connection type - Use custom proxy - SOCKS5
Host: your VPS IP
Port: 1080
```

## Requirements

- VPS running Ubuntu 20.04+ or Debian 10+
- Root SSH access
- Open port for SOCKS5 (default 1080)

## Build from source
```bash
git clone https://github.com/nnaxim/tg-auto-proxy.git
cd tg-auto-proxy
npm install
npm start
```

---

# Proxy Setup (RU)

Electron приложение для автоматической настройки SOCKS5 прокси на вашем VPS сервере через SSH.

## Скачать

Перейди в [Releases](https://github.com/nnaxim/tg-auto-proxy/releases) и скачай файл для своей платформы:

| Платформа | Файл |
|-----------|------|
| Windows   | `Proxy Setup Setup 1.0.0.exe` |
| Linux     | `Proxy Setup-1.0.0.AppImage` |
| macOS     | `Proxy Setup-1.0.0.dmg` |

## Как работает

1. Купи любой VPS с Ubuntu или Debian
2. Открой приложение
3. Введи IP сервера, логин, пароль и порты
4. Нажми **Настроить**
5. Приложение подключается по SSH и автоматически устанавливает и настраивает Dante SOCKS5 прокси
6. Настрой Telegram с полученными данными

## Настройка Telegram

После завершения установки:
```
Settings - Advanced - Connection type - Use custom proxy - SOCKS5
Host: IP вашего VPS
Port: 1080
```

## Требования

- VPS с Ubuntu 20.04+ или Debian 10+
- Root доступ по SSH
- Открытый порт для SOCKS5 (по умолчанию 1080)

## Сборка из исходников
```bash
git clone https://github.com/nnaxim/tg-auto-proxy.git
cd tg-auto-proxy
npm install
npm start
```
