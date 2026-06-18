# 🛠️ Helper Scripts

This folder contains **standalone utility scripts** that were created during
development to solve specific problems (especially with Supabase database
migrations and RLS policies).

## ⚠️ Important

> These scripts are **NOT part of the production build**. They are kept here
> for reference and for one-off operations (e.g., applying a specific fix
> to the database). The actual SQL has been moved to `database/migrations/`.

## 📁 Folder Layout

```
scripts/
├── README.md                       # ← This file
└── database-fixes/                 # 🔧 Database fix scripts
    ├── run_fix_sql.py              # Python: run SQL fix via Supabase REST
    ├── run_leave_requests_fix.py   # Python: legacy leave_requests fix
    ├── run_leave_requests_pg.py    # Python: PostgreSQL direct fix
    └── check_pg.mjs                # Node: verify PostgreSQL connection
```

## 📜 Script History

| Script | Why it was created | Status |
|--------|-------------------|--------|
| `run_fix_sql.py` | Apply SQL via Supabase REST API when dashboard was unreachable | ⚠️ Replaced by `database/migrations/` |
| `run_leave_requests_fix.py` | Fix the `leave_requests` table after schema drift | ✅ Migration `020/021` covers this |
| `run_leave_requests_pg.py` | Direct PG connection when RLS blocked REST API | ✅ Migration covers this |
| `check_pg.mjs` | Quick connection check | ✅ Still useful for debugging |

## 🚀 How to Use

### Python scripts (require `requests` and `psycopg2`)
```bash
pip install requests psycopg2-binary
python scripts/database-fixes/run_fix_sql.py
```

### Node script (no dependencies)
```bash
node scripts/database-fixes/check_pg.mjs
```

### Environment variables
These scripts read from `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@host:5432/db
```

## 🎯 Recommendation

For new database changes, **DO NOT add new scripts here**.
Instead:
1. Create a new file in `database/migrations/` (e.g., `031_xxx.sql`)
2. Apply it via the Supabase Dashboard
3. Document the change in the migration header

This keeps the database evolution **traceable and reproducible**.
