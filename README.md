# Open Computer Orchestration
**Self Hosted / On Premise Desktop and Server Inventory, Management & Software Deployment**

The Open Computer Orchestration (OCO) project enables IT administrators to centrally manage Linux, macOS and Windows machines using a comfortable web interface. Additionally, it provides software deployment features, a user-computer logon overview, lists software packages installed on all computers ("recognised software") and features a fine-grained permission/role system. It focuses on easy usability (GUI) and simplicity.

- [OCO Server](https://github.com/schorschii/oco-server)
- [OCO Server Extensions](https://github.com/schorschii/oco-server-extensions)
- [OCO Agent](https://github.com/schorschii/oco-agent)

## About OCO Server
The OCO server provides the Agent API (used to communicate with the OCO agent), the [Client API](docs/Client-API.md) (can be used by admins to automate workflows, e.g. for Continuous Integration/Delivery/Deployment) and the admin web frontend for the OCO project. On the web frontend you can view computer details and configure software deployment jobs. It can be installed on any Linux distribution. Data is stored in a MySQL database.

![Schematic](.github/oco-schematic.png)

### Screenshots
![Computers](.github/1.png)
![Deployment Wizard](.github/2.png)
![Dark Mode](.github/3.png)

## System Requirements
### Server
- Linux Server
- MySQL/MariaDB Database Server
- Apache2 or an other PHP-capable web server
- PHP 7.0 or newer

### (Admin) Client
- Chromium-based Web Browser (Chrome/Chromium v80 or newer, Opera etc.)
- Firefox (v80 or newer)
- (optional) OCO Client Extensions (for opening RDP, VNC, SSH sessions from the web interface)

### Agent (For Managed Computers)
- please refer to [OCO Agent](https://github.com/schorschii/oco-agent)

## Translations & Contributions Welcome!
Please open a pull request for any improvements you like!

For translators: the language files are in `lib/lang/<langcode>.php`. There you can insert new files with your translations or correct existing ones. Thank you very much!

## Information, Manual, Documentation
**Please read the documentation in the [`/docs`](docs/README.md) folder.**

Quick Links:
- [Overview](docs/README.md)
- [Installation Guide](docs/Server-Installation.md)

## Support & Specific Adjustments
You need support or specific adjustments for your environment? You can hire me to extend OCO to your needs or to write custom reports etc. Please [contact me](https://georg-sieber.de/?page=impressum) if you are interested.
