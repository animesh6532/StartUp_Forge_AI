# Database Schema

## Tables

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### startups
```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  stage VARCHAR(50),
  founded_date DATE,
  team_size INTEGER,
  funding_raised DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES startups(id),
  report_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### analysis
```sql
CREATE TABLE analysis (
  id UUID PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES startups(id),
  report_id UUID REFERENCES reports(id),
  analysis_type VARCHAR(100) NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

```sql
CREATE INDEX idx_startups_user_id ON startups(user_id);
CREATE INDEX idx_reports_startup_id ON reports(startup_id);
CREATE INDEX idx_analysis_startup_id ON analysis(startup_id);
CREATE INDEX idx_analysis_report_id ON analysis(report_id);
```

## Relations

- **users ↔ startups**: One-to-Many
- **startups ↔ reports**: One-to-Many
- **startups ↔ analysis**: One-to-Many
- **reports ↔ analysis**: One-to-Many
