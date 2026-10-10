"""Offline comparison of the exported schema with the frozen initial migration."""
import importlib.util
import os
import re
from pathlib import Path
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

root = Path(r'D:\web apps\Python\CBD_Python')
dump = (root/'hanuram_staging_schema.sql').read_text(encoding='utf-8')
metadata = sa.MetaData()

class Capture:
    def f(self, name): return name
    def create_table(self, name, *args, **kwargs): sa.Table(name, metadata, *args)
    def create_index(self, name, table, columns, unique=False, **kwargs):
        sa.Index(name, *(metadata.tables[table].c[c] for c in columns), unique=unique)

spec = importlib.util.spec_from_file_location('baseline', root/'alembic/versions/62942c9db687_initial_database_schema.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.op = Capture()
module.upgrade()

def normalize(value):
    return value.lower().replace('character varying', 'varchar').replace('timestamp without time zone', 'timestamp').replace(' ', '')

actual = {}
for name, body in re.findall(r'CREATE TABLE public\.(\w+) \((.*?)\n\);', dump, re.S):
    columns = {}
    for line in body.strip().splitlines():
        match = re.match(r'\s*(\w+) (.*?)(?:,)?$', line)
        if match:
            column, definition = match.groups()
            columns[column] = (normalize(definition.replace(' NOT NULL', '').rstrip(',')), 'NOT NULL' not in definition)
    actual[name] = columns

indexes = {}
for unique, name, table, columns in re.findall(r'CREATE (UNIQUE )?INDEX (\w+) ON public\.(\w+) USING btree \(([^;]+)\);', dump):
    indexes[name] = (table, tuple(c.strip() for c in columns.split(',')), bool(unique))

foreign = set()
for table, columns, target, targets in re.findall(r'ALTER TABLE ONLY public\.(\w+)\s+ADD CONSTRAINT \w+ FOREIGN KEY \(([^)]+)\) REFERENCES public\.(\w+)\(([^)]+)\)', dump):
    foreign.add((table, tuple(c.strip() for c in columns.split(',')), target, tuple(c.strip() for c in targets.split(','))))
keys = set()
for table, kind, columns in re.findall(r'ALTER TABLE ONLY public\.(\w+)\s+ADD CONSTRAINT \w+ (PRIMARY KEY|UNIQUE) \(([^)]+)\)', dump):
    keys.add((table, kind, tuple(c.strip() for c in columns.split(','))))

problems, additions = [], []
for name, table in metadata.tables.items():
    if name not in actual:
        problems.append(f'Missing table: {name}')
        continue
    for column in table.c:
        expected = (normalize(str(column.type.compile(dialect=postgresql.dialect()))), column.nullable)
        if actual[name].get(column.name) != expected:
            problems.append(f'Column mismatch: {name}.{column.name}: expected={expected}, actual={actual[name].get(column.name)}')
    for column in actual[name].keys() - table.c.keys():
        additions.append(f'Additional column: {name}.{column}')
    for index in table.indexes:
        expected = (name, tuple(c.name for c in index.columns), bool(index.unique))
        if indexes.get(index.name) != expected:
            problems.append(f'Index mismatch: {index.name}')
    for fk in table.foreign_key_constraints:
        expected = (name, tuple(fk.column_keys), fk.referred_table.name, tuple(e.column.name for e in fk.elements))
        if expected not in foreign:
            problems.append(f'Missing foreign key: {expected}')
    for constraint in table.constraints:
        kind = 'PRIMARY KEY' if isinstance(constraint, sa.PrimaryKeyConstraint) else 'UNIQUE' if isinstance(constraint, sa.UniqueConstraint) else None
        if kind and (name, kind, tuple(c.name for c in constraint.columns)) not in keys:
            problems.append(f'Missing {kind}: {name}.{tuple(c.name for c in constraint.columns)}')

print('Initial migration tables checked:', len(metadata.tables))
print('Blocking differences:', len(problems))
for item in problems: print(item)
for item in additions: print(item)
print('Additional tables:', ', '.join(sorted(actual.keys() - metadata.tables.keys())))

os.environ['DATABASE_URL'] = 'postgresql+psycopg://unused:unused@127.0.0.1:1/unused'
os.environ['AUTO_CREATE_TABLES'] = 'false'
import sys
sys.path.insert(0, str(root))
from app.models.whatsapp_connection import WhatsAppConnection, WhatsAppSignupAttempt
for model in (WhatsAppConnection, WhatsAppSignupAttempt):
    table = model.__table__
    for column in table.c:
        if column.name == 'is_default':
            continue  # Added by the new SaaS migration, not the historical connection schema.
        expected = (normalize(str(column.type.compile(dialect=postgresql.dialect()))), column.nullable)
        if actual.get(table.name, {}).get(column.name) != expected:
            problems.append(f'WhatsApp column mismatch: {table.name}.{column.name}')
    for fk in table.foreign_key_constraints:
        expected = (table.name, tuple(fk.column_keys), fk.referred_table.name, tuple(e.column.name for e in fk.elements))
        if expected not in foreign:
            problems.append(f'WhatsApp foreign key mismatch: {expected}')
    if (table.name, 'PRIMARY KEY', tuple(c.name for c in table.primary_key.columns)) not in keys:
        problems.append(f'WhatsApp primary key mismatch: {table.name}')
for column in ('organization_id', 'phone_number_id'):
    if ('whatsapp_connections', 'UNIQUE', (column,)) not in keys:
        problems.append(f'Missing historical connection unique key: {column}')
if indexes.get('ix_whatsapp_connections_tenant_id') != ('whatsapp_connections', ('tenant_id',), False):
    problems.append('Missing WhatsApp tenant index')

spec = importlib.util.spec_from_file_location('repair', root/'alembic/versions/e73a2109b001_repair_tenant_schema.py')
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)
for name, ddl, expected_indexes in repair.MARKETING_SCHEMA:
    body = re.search(r'CREATE TABLE \w+ \((.*?)\n\)', ddl, re.S).group(1)
    for line in body.splitlines():
        match = re.match(r'\s*(\w+) (SERIAL|INTEGER|VARCHAR\(\d+\)|TEXT|JSONB|BOOLEAN|TIMESTAMP WITHOUT TIME ZONE)( NOT NULL)?\s*,?\s*$', line)
        if match:
            column, kind, not_null = match.groups()
            expected = (normalize('INTEGER' if kind == 'SERIAL' else kind), not bool(not_null))
            if actual.get(name, {}).get(column) != expected:
                problems.append(f'Marketing column mismatch: {name}.{column}')
    for columns, target, targets in re.findall(r'FOREIGN KEY\(([^)]+)\) REFERENCES (\w+) \(([^)]+)\)', ddl):
        expected = (name, tuple(c.strip() for c in columns.split(',')), target, tuple(c.strip() for c in targets.split(',')))
        if expected not in foreign:
            problems.append(f'Marketing foreign key mismatch: {expected}')
    for statement in expected_indexes:
        index, table, columns = re.search(r'CREATE INDEX (\w+) ON (\w+) \(([^)]+)\)', statement).groups()
        if indexes.get(index) != (table, tuple(c.strip() for c in columns.split(',')), False):
            problems.append(f'Marketing index mismatch: {index}')
print('Final differences after WhatsApp and marketing checks:', len(problems))
for item in problems: print(item)
