"""Package only explicitly reviewed backend files; never writes to the backend."""
from pathlib import Path
import difflib
import hashlib
import json

root = Path(__file__).resolve().parents[1]
staged = root / '.onboarding-backend'
backend = Path(r'D:\web apps\Python\CBD_Python')
files = [
    'app/models/saas.py', 'app/services/onboarding.py', 'app/routers/saas.py',
    'app/routers/platform.py', 'app/routers/whatsapp_connections.py',
    'app/services/whatsapp_connections.py', 'app/database/tenancy.py',
    'alembic/versions/f91c320ab009_managed_onboarding.py',
    'scripts/run_authorization_sandbox.py', 'tests/test_managed_onboarding.py',
    'tests/test_whatsapp_connections.py', 'tests/integration/test_saas_api.py',
    'tests/integration/test_manual_subscriptions_api.py',
    'tests/integration/test_whatsapp_connections_api.py',
    'tests/security/test_authorization_roles.py', 'MANAGED_WHATSAPP_ONBOARDING.md',
]
manifest, patches = [], []
for relative in files:
    source = staged / relative
    target = backend / relative
    before = target.read_bytes() if target.exists() else None
    after = source.read_bytes()
    if before == after:
        continue
    manifest.append({'path': relative, 'original_sha256': hashlib.sha256(before).hexdigest() if before is not None else None,
                     'staged_sha256': hashlib.sha256(after).hexdigest()})
    patches.append(f'diff --git a/{relative} b/{relative}\n')
    if before is None:
        patches.append('new file mode 100644\n')
    patches.extend(difflib.unified_diff((before or b'').decode('utf-8-sig').splitlines(keepends=True),
        after.decode('utf-8-sig').splitlines(keepends=True),
        fromfile=f'a/{relative}' if before is not None else '/dev/null', tofile=f'b/{relative}'))
(root / 'docs/onboarding-backend-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
(root / 'docs/onboarding-backend.patch').write_text(''.join(patches), encoding='utf-8')
print(f'Prepared {len(manifest)} reviewed backend files; backend unchanged.')
