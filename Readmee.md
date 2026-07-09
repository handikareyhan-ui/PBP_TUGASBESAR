# Panduan Instalasi dan Menjalankan BansosChain

Dokumen ini berisi langkah-langkah untuk menginstal, mengonfigurasi, dan menjalankan sistem **BansosChain** yang menggunakan **MongoDB** dan **Hyperledger Fabric**.

---

# 1. Menjalankan MongoDB (Replica Set)

Prisma ORM memerlukan **MongoDB Replica Set** agar fitur transaksi (transaction) seperti `upsert` dapat berjalan dengan baik. Oleh karena itu, MongoDB harus dijalankan sebagai **single-node replica set**.

## Opsi A: Menggunakan Docker (WSL2 atau Native)

Jalankan perintah berikut untuk menjalankan MongoDB di dalam Docker:

```bash
# 1. Menjalankan container MongoDB dengan konfigurasi replica set
docker run --name mongodb -d -p 27017:27017 mongo:latest --replSet rs0

# 2. Menginisialisasi replica set
docker exec -it mongodb mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] })"
```

## Opsi B: Menggunakan MongoDB yang Terpasang di Windows

1. Buka file konfigurasi `mongod.cfg`.
2. Tambahkan konfigurasi berikut:

```yaml
replication:
  replSetName: rs0
```

3. Restart layanan (service) MongoDB di Windows.
4. Buka `mongosh`, kemudian jalankan:

```javascript
rs.initiate()
```

---

# 2. Menjalankan Backend

### 1. Masuk ke folder backend

```bash
cd Backend
```

### 2. Atur file `.env`

Pastikan file `.env` memiliki konfigurasi berikut:

```env
PORT=3000
DATABASE_URL="mongodb://localhost:27017/bansoschain"
JWT_SECRET="bansoschain_super_secret_jwt_key_2026"
```

### 3. Sinkronisasi Prisma dengan Database

Jalankan perintah berikut:

```bash
npx prisma db push
npx prisma generate
```

### 4. Jalankan Backend

```bash
npm run dev
```

Apabila berhasil, backend akan berjalan pada port **3000**.

---

# 3. Menjalankan Frontend

### 1. Masuk ke folder frontend

```bash
cd Frontend
```

### 2. Atur file `.env`

Pastikan konfigurasi berikut sudah sesuai:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Jalankan Frontend

```bash
npm run dev
```

### 4. Akses aplikasi

Buka browser dan akses:

```
http://localhost:5173/
```

---

# 4. Menjalankan Jaringan Hyperledger Fabric

BansosChain menggunakan jaringan **Hyperledger Fabric** dengan spesifikasi sebagai berikut:

- Konsensus **Raft** (3 Orderer)
- 4 Peer
- CouchDB sebagai State Database
- Node.js Chaincode-as-a-Service (CCaaS)

## Langkah 1. Membersihkan Jaringan Lama

Apabila masih terdapat jaringan Fabric sebelumnya yang sedang berjalan, hentikan dan hapus container berikut:

```bash
wsl -d Ubuntu docker rm -f cli network-peer0.org1.example.com-1 network-peer0.org2.example.com-1 network-peer1.org1.example.com-1 network-peer1.org2.example.com-1 network-orderer.example.com-1 network-couchdb0-1 network-couchdb1-1 network-couchdb2-1 network-couchdb3-1
```

---

## Langkah 2. Menjalankan Jaringan Hyperledger Fabric

Dari direktori utama (root project), jalankan:

```bash
wsl -d Ubuntu docker-compose -f "/mnt/d/03_File Reyhan/TUGAS BESAR KELOMPOK 8 BANSOS CHAIN/blockchain/docker/docker-compose.yml" up -d
```

Perintah tersebut akan menjalankan seluruh layanan Hyperledger Fabric menggunakan Docker Compose.

---

## Langkah 3. Inisialisasi Channel dan Chaincode

Jalankan script berikut untuk:

- Membuat channel
- Menghubungkan seluruh peer ke channel
- Menginstal chaincode
- Melakukan approve chaincode
- Commit chaincode
- Inisialisasi smart contract **bansoschain** pada channel **bansoschannel**

```bash
wsl -d Ubuntu docker exec docker_cli_1 bash ./scripts/setup-ledger.sh
```

---

## Langkah 4. Memastikan Deployment Berhasil

### Melihat daftar channel

```bash
wsl -d Ubuntu docker exec docker_cli_1 peer channel list
```

### Melihat chaincode yang telah berhasil di-deploy

```bash
wsl -d Ubuntu docker exec docker_cli_1 peer lifecycle chaincode querycommitted -C bansoschannel
```

Apabila perintah di atas berhasil dijalankan tanpa error dan chaincode **bansoschain** muncul pada hasil `querycommitted`, maka jaringan Hyperledger Fabric telah berhasil dijalankan dan siap digunakan oleh aplikasi BansosChain.

---

# Arsitektur Sistem

Sistem BansosChain terdiri dari empat komponen utama:

1. **MongoDB** sebagai basis data utama.
2. **Backend** berbasis Node.js yang menyediakan REST API dan menghubungkan aplikasi dengan blockchain.
3. **Frontend** sebagai antarmuka pengguna.
4. **Hyperledger Fabric** sebagai jaringan blockchain untuk menyimpan data transaksi secara aman dan transparan.

Seluruh komponen tersebut harus berjalan agar aplikasi BansosChain dapat digunakan secara optimal.