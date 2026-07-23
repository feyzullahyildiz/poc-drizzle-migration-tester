# drizzle-migration-test

[testcontainers](https://testcontainers.com/) ve PostgreSQL kullanarak Drizzle ORM migrasyonlarını test eden bir framework.

## Komutlar

```bash
# Bağımlılıkları yükle
npm install

# Yeni migrasyon oluştur (schema değişikliklerinden)
npx drizzle-kit generate --name <migration_name>

# Boş bir custom migrasyon oluştur
npx drizzle-kit generate --custom --name <migration_name>

# Testleri çalıştır (watch mode)
npm run test

# Testleri çalıştır (tek seferlik)
npm run test:run
```

## Proje Yapısı

```
src/drizzle/
├── <migration_folder>/      # örn. 20260717152745_init
│   ├── migration.sql        # Üretilen migrasyon SQL'i
│   ├── snapshot.json        # Drizzle Kit snapshot
│   ├── test_seeds/          # (isteğe bağlı) Başarılı olması beklenen SQL dosyaları
│   │   ├── insert_user_a.sql
│   │   └── ...
│   └── test_errors/         # (isteğe bağlı) Hata fırlatması beklenen SQL dosyaları
│       └── email_error.sql
└── ...
```

## Testler Nasıl Çalışır

Testler `@testcontainers/postgresql` ile gerçek bir PostgreSQL container'ı ayağa kaldırır ve migrasyonları buna karşı çalıştırır.

### `getMatrix` — Seed Kombinasyon Matrisi

Her migrasyondaki `test_seeds` dosya sayılarından oluşan bir dizi alır ve tüm olası seed kombinasyonlarını üretir.

- Eğer bir migrasyonda **seed dosyası yoksa (0)**, o pozisyona `null` konur (seed atlanır).
- Eğer **N tane seed varsa**, 0'dan N-1'e kadar her index için bir kombinasyon oluşturulur.

Bu sayede her migrasyonun her farklı seed verisiyle çalıştığı test edilir.

**Örnek — 3 migrasyon, seed sayıları `[3, 2, 0]`:**

```
[0, 0, null]   → mig0 seed[0], mig1 seed[0], mig2 seedsiz
[0, 1, null]   → mig0 seed[0], mig1 seed[1], mig2 seedsiz
[1, 0, null]   → mig0 seed[1], mig1 seed[0], mig2 seedsiz
[1, 1, null]   → mig0 seed[1], mig1 seed[1], mig2 seedsiz
[2, 0, null]   → mig0 seed[2], mig1 seed[0], mig2 seedsiz
[2, 1, null]   → mig0 seed[2], mig1 seed[1], mig2 seedsiz
```

6 farklı senaryo oluşur ve her biri ayrı bir `describe` bloğunda test edilir.

### `getErrorMatrix` — Hata Testi Senaryoları

Her migrasyondaki `test_errors` dosya sayılarından oluşan bir dizi alır ve her hata dosyası için bir `{ migrationIndex, errorFileIndex }` nesnesi döner.

- `migrationIndex`: Hatalı SQL'in ait olduğu migrasyonun sırası
- `errorFileIndex`: O migrasyondaki hata dosyasının index'i

Test, her senaryoda önce **hatalı migrasyona kadar tüm migrasyonları ve seed'leri uygular**, ardından hatalı SQL'i çalıştırıp **hata fırlatmasını bekler**.

**Örnek — 3 migrasyon, error sayıları `[1, 0, 1]`:**

```
{ migrationIndex: 0, errorFileIndex: 0 }   → email_error.sql
{ migrationIndex: 2, errorFileIndex: 0 }   → set_display_name_null.sql
```

İlk senaryoda önce mig0 uygulanır, ardından `email_error.sql` çalıştırılır ve duplicate email hatası beklenir. İkinci senaryoda önce mig0 ve mig1 uygulanır, ardından mig2'nin `set_display_name_null.sql` çalıştırılır ve NOT NULL constraint hatası beklenir.

## Konfigürasyon

- **Drizzle config**: `drizzle.config.ts` — migrasyonları `./src/drizzle` dizinine çıkarır, PostgreSQL dialektini kullanır
- **Schema dosyası**: `src/db/schema.ts` — tablolarınızı burada tanımlayın
- **Test config**: `vitest.config.ts` — `src/drizzle/**` değiştiğinde testler otomatik yeniden çalışır
