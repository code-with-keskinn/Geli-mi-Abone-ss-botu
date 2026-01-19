# 📸 Discord Abone SS Onay Botu

Gelişmiş **fotoğraf (SS) onay sistemi**, **butonlu moderasyon**, **yetkili istatistikleri** ve **otomatik ses kanalına bağlanma** özelliklerine sahip, production-ready Discord botu.

---

## 🚀 Özellikler

* 📷 **Sadece Fotoğraf Kabulü**

  * Belirlenen kanalda sadece fotoğraf paylaşılabilir
  * Fotoğraf dışı mesajlar otomatik silinir
  * Kullanıcıya DM ile bilgilendirme gönderilir

* ✅❌ **Butonlu Onay / Red Sistemi**

  * Embed üzerinden inceleme
  * Onay → Abone rolü otomatik verilir
  * Red → Sebep zorunlu modal açılır

* 🧾 **Red Sebebi Modalı**

  * Yetkili sebep girmek zorundadır
  * Kullanıcıya embed olarak DM gider

* 📊 **Yetkili İstatistikleri**

  * Onay / Red / Toplam işlem sayısı
  * `/stats` komutu ile sıralamalı gösterim
  * Veriler `stats.json` içinde kalıcı saklanır

* 🔔 **Staff Bildirimi**

  * Yeni fotoğraf geldiğinde tüm stafflara DM
  * Direkt mesaj linki içerir

* 📝 **Log Sistemi**

  * Onaylanan / reddedilen her işlem log kanalına düşer
  * Fotoğraf embed içinde saklanır

* 🎧 **Otomatik Ses Kanalı**

  * Bot açılışta belirlenen ses kanalına bağlanır
  * 7/24 aktif kalır

---

## 🧩 Kullanılan Teknolojiler

* Node.js
* discord.js v14
* @discordjs/voice
* Slash Commands
* Buttons & Modals

---

## ⚙️ Kurulum

### 1️⃣ Gereksinimler

* Node.js **v18+**
* Discord Bot Token
* Staff & Abone rolleri

### 2️⃣ Modülleri Kur

```bash
npm install discord.js @discordjs/voice
```

### 3️⃣ Config Ayarları

`index.js` içindeki `config` alanını doldur:

```js
const config = {
  photoChannelId: 'FOTO_KANAL_ID',
  logChannelId: 'LOG_KANAL_ID',
  subscriberRoleId: 'ABONE_ROL_ID',
  staffRoleId: 'STAFF_ROL_ID',
  sunucuid: 'SUNUCU_ID',
  sesid: 'SES_KANALI_ID',
  token: 'BOT_TOKEN'
};
```

> ⚠️ ID’leri geliştirici modundan aldığından emin ol.

---

## 📌 Komutlar

| Komut    | Açıklama                          | Yetki         |
| -------- | --------------------------------- | ------------- |
| `/stats` | Yetkili istatistiklerini gösterir | Staff / Admin |

---

## 🛡️ Yetkilendirme & Güvenlik

* Butonlar sadece **staff rolü** veya **admin** tarafından kullanılabilir
* Yetkisiz işlemler otomatik engellenir
* Interaction bazlı yetki kontrolü vardır

---

## 📂 Dosya Yapısı

```
📁 bot
 ├── index.js
 ├── stats.json
 ├── package.json
 └── README.md
```

---

## 🔗 Sosyal & Destek

💬 Discord Sunucusu
👉 **[https://discord.gg/TGZywYT7zm](https://discord.gg/TGZywYT7zm)**

Hata bildirimi, öneri ve destek için sunucuya katılabilirsiniz.

---

## ⭐ Destek Ol

* ⭐ Repo’ya star at
* 🛠️ Fork’la geliştir
* 🧠 Geri bildirim bırak

---

**Gelişmiş, güvenli ve büyük sunucular için uygundur.**

Not : İdol = **[Zypheris](https://github.com/Zypheriss)**
